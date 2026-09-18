const http = require('http');
const express = require('express');
const { io: ioClient } = require('socket.io-client');
const { app, httpServer, ensureDbInitialized } = require('./backend/src/server');
const db = require('./backend/src/db/database');

const TEST_PORT = 5055;

async function runRealTimeSyncTests() {
  console.log('====================================================');
  console.log('🧪 Starting Multi-Device Real-Time Synchronization Tests');
  console.log('====================================================');

  await ensureDbInitialized();

  // 1. Start Server on test port
  await new Promise((resolve) => {
    httpServer.listen(TEST_PORT, '127.0.0.1', () => {
      console.log(`✓ Test Server active with Socket.IO on port ${TEST_PORT}`);
      resolve();
    });
  });

  const serverUrl = `http://127.0.0.1:${TEST_PORT}`;

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, description) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  }

  try {
    // 2. Connect Device 1 (Cashier Terminal)
    const cashierDevice = ioClient(serverUrl, { transports: ['websocket'] });
    await new Promise((resolve) => cashierDevice.on('connect', resolve));
    assert(cashierDevice.connected, 'Device 1 (Cashier POS) connected via WebSocket');

    cashierDevice.emit('register_device', {
      deviceId: 'DEV-CASHIER-1',
      deviceLabel: 'Counter 1 POS (Desktop)',
      cashierName: 'Gowtham (Cashier)',
      role: 'admin'
    });

    // 3. Connect Device 2 (Admin Dashboard)
    const adminDashboard = ioClient(serverUrl, { transports: ['websocket'] });
    await new Promise((resolve) => adminDashboard.on('connect', resolve));
    assert(adminDashboard.connected, 'Device 2 (Admin Dashboard) connected via WebSocket');

    adminDashboard.emit('register_device', {
      deviceId: 'DEV-ADMIN-DESK',
      deviceLabel: 'Admin Office Desktop',
      cashierName: 'Admin',
      role: 'admin'
    });

    // 4. Test Live Cart Synchronization (Device 1 adds products -> Device 2 receives update)
    console.log('\n--- Test: Real-Time POS Cart Synchronization ---');
    const liveCartPromise = new Promise((resolve) => {
      adminDashboard.on('pos:live_activity_updated', (data) => {
        resolve(data);
      });
    });

    const mockCart = {
      deviceId: 'DEV-CASHIER-1',
      deviceLabel: 'Counter 1 POS (Desktop)',
      cashierName: 'Gowtham (Cashier)',
      sectionId: 1,
      items: [
        {
          product_id: 1,
          product_name: 'Aashirvaad Superior MP Atta 5kg',
          product_name_tamil: 'ஆசீர்வாத் கோதுமை மாவு 5கிலோ',
          sku: 'ATTA-001',
          unit: 'bag',
          quantity: 2,
          price: 245.0,
          rate_type: 'c_rate',
          total: 490.0
        },
        {
          product_id: 2,
          product_name: 'Tata Salt Vacuum Evaporated 1kg',
          product_name_tamil: 'டாடா உப்பு 1கிலோ',
          sku: 'SALT-001',
          unit: 'pkt',
          quantity: 3,
          price: 28.0,
          rate_type: 'c_rate',
          total: 84.0
        }
      ],
      subtotal: 574.0,
      discount: 24.0,
      discountType: 'flat',
      taxPercentage: 5,
      taxAmount: 27.5,
      grandTotal: 578.0,
      selectedCustomer: { id: 1, name: 'Suresh Kumar', phone: '9876543210' },
      paymentMethod: 'upi',
      rateMode: 'c_rate'
    };

    cashierDevice.emit('pos:cart_update', mockCart);

    const receivedUpdate = await liveCartPromise;
    assert(receivedUpdate.session.deviceId === 'DEV-CASHIER-1', 'Admin Dashboard received live update from DEV-CASHIER-1');
    assert(receivedUpdate.session.items.length === 2, 'Admin Dashboard received both cart items');
    assert(receivedUpdate.session.items[0].product_name_tamil === 'ஆசீர்வாத் கோதுமை மாவு 5கிலோ', 'Tamil product name preserved in real-time sync');
    assert(receivedUpdate.session.grandTotal === 578.0, 'Live Grand Total synchronized accurately');
    assert(receivedUpdate.session.paymentMethod === 'upi', 'Payment method synchronized');

    // 5. Test Live Cart Item Modification (Cashier updates quantity)
    console.log('\n--- Test: Real-Time Cart Modification ---');
    const updatedCartPromise = new Promise((resolve) => {
      adminDashboard.on('pos:live_activity_updated', (data) => {
        if (data.session.items[0].quantity === 5) {
          resolve(data);
        }
      });
    });

    const modifiedCart = {
      ...mockCart,
      items: [
        {
          ...mockCart.items[0],
          quantity: 5,
          total: 1225.0
        },
        mockCart.items[1]
      ],
      subtotal: 1309.0,
      grandTotal: 1349.0
    };

    cashierDevice.emit('pos:cart_update', modifiedCart);
    const modUpdate = await updatedCartPromise;
    assert(modUpdate.session.items[0].quantity === 5, 'Device 2 observed instant quantity increase to 5');
    assert(modUpdate.session.grandTotal === 1349.0, 'Device 2 observed updated grand total ₹1,349');

    // 5b. Test Database Draft Persistence & REST API
    console.log('\n--- Test: Persistent Draft Database Storage & pos:section_synced ---');
    const posDevice2 = ioClient(serverUrl, { transports: ['websocket'] });
    await new Promise((resolve) => posDevice2.on('connect', resolve));
    posDevice2.emit('register_device', {
      deviceId: 'DEV-MOBILE-PHONE',
      deviceLabel: 'Cashier Mobile Phone',
      cashierName: 'Mobile User',
      role: 'admin'
    });

    // Obtain auth token for POS requests
    const authRes = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Shop Admin', secret: 'admin123' })
    });
    const authData = await authRes.json();
    const token = authData.token;

    const sectionSyncPromise = new Promise((resolve) => {
      posDevice2.on('pos:section_synced', (data) => {
        if (data.section.id === 2 && data.updatedByDevice === 'DEV-CASHIER-1') {
          resolve(data);
        }
      });
    });

    // Mobile / Desktop adds items to Section 2
    const section2Cart = {
      deviceId: 'DEV-CASHIER-1',
      deviceLabel: 'Counter 1 POS (Desktop)',
      cashierName: 'Gowtham (Cashier)',
      sectionId: 2,
      items: [
        {
          product_id: 1,
          product_name: 'Aashirvaad Superior MP Atta 5kg',
          product_name_tamil: 'ஆசீர்வாத் கோதுமை மாவு 5கிலோ',
          sku: 'ATTA-001',
          unit: 'bag',
          quantity: 4,
          price: 245.0,
          rate_type: 'c_rate',
          total: 980.0
        }
      ],
      subtotal: 980.0,
      discount: 0,
      discountType: 'flat',
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 980.0,
      paymentMethod: 'cash',
      rateMode: 'c_rate'
    };

    cashierDevice.emit('pos:cart_update', section2Cart);

    const sectionSyncedData = await sectionSyncPromise;
    assert(sectionSyncedData.section.id === 2, 'Mobile Device received pos:section_synced for Section 2');
    assert(sectionSyncedData.section.items[0].quantity === 4, 'Section 2 item quantity synchronized to Mobile POS');

    // Verify REST API returns persistent draft
    const draftsRes = await fetch(`${serverUrl}/api/pos/drafts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const draftsJson = await draftsRes.json();
    assert(draftsRes.ok && Array.isArray(draftsJson.drafts), 'GET /api/pos/drafts returned draft bills');
    const sec2Draft = draftsJson.drafts.find(d => d.id === 2);
    assert(sec2Draft && sec2Draft.items.length === 1, 'Section 2 draft saved persistently in SQLite pos_draft_bills');

    // 6. Test Bill Completion Broadcast
    console.log('\n--- Test: Bill Completion & Transaction Broadcast ---');
    const billCompletedPromise = new Promise((resolve) => {
      adminDashboard.on('bill:completed', (event) => {
        resolve(event);
      });
    });

    // Ensure a test product exists
    let testProd = db.prepare('SELECT * FROM products LIMIT 1').get();
    if (!testProd) {
      db.prepare(`
        INSERT INTO products (name, name_tamil, category, sku, selling_price, w_rate, c_rate, stock, unit)
        VALUES ('Aashirvaad Atta 5kg', 'ஆசீர்வாத் கோதுமை மாவு', 'Groceries', 'ATTA-001', 245, 230, 245, 100, 'bag')
      `).run();
      testProd = db.prepare('SELECT * FROM products LIMIT 1').get();
    }

    // Submit bill for Section 2 via REST API
    const billRes = await fetch(`${serverUrl}/api/bills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        deviceId: 'DEV-CASHIER-1',
        sectionId: 2,
        customer_name: 'Real-Time Sync Test Customer',
        customer_phone: '9988776655',
        items: [
          { product_id: testProd.id, quantity: 1, price: testProd.selling_price || 245, rate_type: 'c_rate' }
        ],
        payment_method: 'cash'
      })
    });

    const billJson = await billRes.json();
    if (!billRes.ok) {
      console.error('Bill creation failed:', billJson);
    }
    assert(billRes.ok, `Bill created successfully: ${billJson.bill?.bill_number}`);

    const billCompletedEvent = await billCompletedPromise;
    assert(billCompletedEvent.bill.bill_number === billJson.bill.bill_number, 'Admin Dashboard received matching bill:completed event');
    assert(billCompletedEvent.today_bills >= 1, 'Today bills count automatically incremented in broadcast payload');
    assert(Array.isArray(billCompletedEvent.updatedProducts), 'Updated inventory stocks included in completed bill broadcast');

    // Verify draft was deleted upon checkout
    const postCheckoutDrafts = await (await fetch(`${serverUrl}/api/pos/drafts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })).json();
    const postSec2Draft = postCheckoutDrafts.drafts?.find(d => d.id === 2);
    assert(!postSec2Draft || postSec2Draft.items.length === 0, 'Completed Section 2 draft automatically deleted from pos_draft_bills upon checkout');

    // 7. Test Disconnect and Cleanup
    cashierDevice.disconnect();
    adminDashboard.disconnect();
    posDevice2.disconnect();

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} REAL-TIME SYNCHRONIZATION TESTS PASSED!`);
    console.log('====================================================');

    await new Promise(r => setTimeout(r, 200));
    httpServer.close(() => {
      process.exit(0);
    });
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

runRealTimeSyncTests();
