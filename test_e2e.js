const BASE_URL = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('🧪 Starting Comprehensive E2E Verification Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('1. Verifying Server Health & Database Connection...');
    const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
    assert(healthRes.status === 'ok', 'API Health Check returns status: ok');

    // 2. Authentication
    console.log('\n2. Testing Role-Based Authentication...');
    // Admin Login
    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@shop.com', password: 'admin123', role: 'admin' })
    }).then(r => r.json());
    assert(adminLogin.token && adminLogin.user.role === 'admin', 'Admin logged in successfully with JWT');
    const adminToken = adminLogin.token;

    // Customer Login
    const custLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'customer@gmail.com', password: 'customer123', role: 'customer' })
    }).then(r => r.json());
    assert(custLogin.token && custLogin.user.role === 'customer', 'Customer (Arun Kumar) logged in successfully');
    const custToken = custLogin.token;

    // 3. Customer Product Catalog & Stock Status
    console.log('\n3. Testing Product Catalog & Stock Levels...');
    const prodRes = await fetch(`${BASE_URL}/products?status=active`).then(r => r.json());
    assert(prodRes.products.length >= 15, `Found ${prodRes.products.length} active retail products`);
    assert(prodRes.categories.length >= 4, `Found categories: ${prodRes.categories.join(', ')}`);

    // Lookup by barcode
    const barcodeLookup = await fetch(`${BASE_URL}/products/lookup/RICE005`).then(r => r.json());
    assert(barcodeLookup.product && barcodeLookup.product.name.includes('Rice'), 'Fast barcode/SKU lookup for RICE005 succeeded');
    const riceProduct = barcodeLookup.product;
    const initialRiceStock = riceProduct.stock;
    console.log(`    Current stock of ${riceProduct.name}: ${initialRiceStock} ${riceProduct.unit}`);

    // 4. Customer Places New Order
    console.log('\n4. Testing Customer Order Placement...');
    const newOrderPayload = {
      delivery_address: '12/4, Gandhi Street, Chennai',
      notes: 'Urgent delivery before evening',
      items: [
        { product_id: riceProduct.id, quantity: 2 },
        { product_id: 2, quantity: 1 } // Sugar
      ]
    };

    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${custToken}`
      },
      body: JSON.stringify(newOrderPayload)
    }).then(r => r.json());

    assert(orderRes.order && orderRes.order.order_number, `Customer placed order #${orderRes.order?.order_number} successfully`);
    const placedOrderId = orderRes.order.id;

    // 5. Customer Views Order in "My Orders"
    console.log('\n5. Testing Customer My Orders List...');
    const custOrdersRes = await fetch(`${BASE_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${custToken}` }
    }).then(r => r.json());
    const foundOrder = custOrdersRes.orders.find(o => o.id === placedOrderId);
    assert(foundOrder && foundOrder.status === 'pending', `Order #${foundOrder?.order_number} verified in customer queue with status: pending`);

    // 6. Admin Order Management Pipeline
    console.log('\n6. Testing Admin Order Status Transitions...');
    // Accept
    const acceptRes = await fetch(`${BASE_URL}/orders/${placedOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'accepted' })
    }).then(r => r.json());
    assert(acceptRes.new_status === 'accepted', 'Admin accepted the order');

    // Mark Preparing
    await fetch(`${BASE_URL}/orders/${placedOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'preparing' })
    });

    // Mark Ready
    const readyRes = await fetch(`${BASE_URL}/orders/${placedOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'ready' })
    }).then(r => r.json());
    assert(readyRes.new_status === 'ready', 'Admin marked order Ready for pickup');

    // 7. 1-Click Convert Ready Order to Completed Bill & Print Receipt
    console.log('\n7. Testing Convert Order to POS Bill & Thermal Receipt Generation...');
    const convertRes = await fetch(`${BASE_URL}/orders/${placedOrderId}/convert-to-bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ payment_method: 'cash' })
    }).then(r => r.json());

    assert(convertRes.bill_id && convertRes.bill_number, `Order converted to Bill #${convertRes.bill_number} (Total: ₹${convertRes.grand_total})`);

    // Verify Stock Auto-Decremented
    const riceAfterOrder = await fetch(`${BASE_URL}/products/lookup/RICE005`).then(r => r.json());
    assert(riceAfterOrder.product.stock === initialRiceStock - 2, `Rice stock decremented accurately: ${initialRiceStock} -> ${riceAfterOrder.product.stock}`);

    // 8. POS High-Speed Counter Billing
    console.log('\n8. Testing High-Speed POS Counter Billing (Atomic Stock Reduction)...');
    const posBillPayload = {
      customer_id: custLogin.user.customer_id,
      customer_name: 'Arun Kumar',
      customer_phone: '9876543210',
      items: [
        { product_id: riceProduct.id, quantity: 1, price: riceProduct.selling_price },
        { product_id: 3, quantity: 1, price: 145 } // Cooking Oil
      ],
      discount: 10,
      discount_type: 'flat',
      tax_percentage: 0,
      payment_method: 'upi',
      payment_reference: 'UPI/COUNTER-SCAN-01'
    };

    const posBillRes = await fetch(`${BASE_URL}/bills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(posBillPayload)
    }).then(r => r.json());

    assert(posBillRes.bill && posBillRes.bill.bill_number, `POS Bill #${posBillRes.bill?.bill_number} generated (Total: ₹${posBillRes.bill?.grand_total})`);
    assert(posBillRes.items && posBillRes.items.length === 2, 'Bill contains itemized line records');
    assert(posBillRes.settings && posBillRes.settings.shop_name, `Thermal Receipt Settings attached: "${posBillRes.settings?.shop_name}"`);

    // 9. Stock Inventory Audit Trail
    console.log('\n9. Testing Stock Transaction Audit Log...');
    const stockHistoryRes = await fetch(`${BASE_URL}/stock/history`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());
    const latestTx = stockHistoryRes.history[0];
    assert(latestTx && latestTx.transaction_type === 'BILL_SALE', `Latest audit transaction recorded: ${latestTx?.transaction_type} for ${latestTx?.product_name} (New Stock: ${latestTx?.new_stock})`);

    // 10. Daily Bills & Summary Bar
    console.log('\n10. Testing Daily Bills & Revenue Metrics...');
    const dailyBillsRes = await fetch(`${BASE_URL}/bills`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(dailyBillsRes.bills.length >= 2, `Found ${dailyBillsRes.bills.length} bills in daily record`);
    assert(dailyBillsRes.summary && Number(dailyBillsRes.summary.total_sales) > 0, `Total daily sales calculated: ₹${dailyBillsRes.summary?.total_sales}`);

    // 11. Reports & Gross Margins
    console.log('\n11. Testing Financial Reports & Analytics...');
    const reportsRes = await fetch(`${BASE_URL}/reports/sales`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(reportsRes.overall && reportsRes.overall.total_revenue > 0, `Financial report generated: Revenue ₹${reportsRes.overall.total_revenue}, Est. Gross Profit ₹${reportsRes.overall.estimated_profit}`);

    // 12. Settings & Receipt Customization
    console.log('\n12. Testing Shop Settings & Thermal Customization...');
    const settingsRes = await fetch(`${BASE_URL}/settings`).then(r => r.json());
    assert(settingsRes.settings.shop_name && settingsRes.settings.thermal_paper_width === '100mm', `Shop Settings verified: ${settingsRes.settings.shop_name} (Paper width: ${settingsRes.settings.thermal_paper_width})`);

    console.log(`\n=================================================`);
    console.log(`🎉 ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=================================================`);
  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runE2ETests();
