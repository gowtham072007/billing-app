import React from 'react';
import { Bill, BillItem, ShopSettings } from '../../types';
import { formatPrintBillQty } from '../../utils/qtyHelper';

interface ThermalReceiptProps {
  bill: Bill;
  items: BillItem[];
  settings?: Partial<ShopSettings>;
  paperWidth?: '58mm' | '80mm' | '100mm';
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  bill,
  items,
  settings = {},
  paperWidth = '100mm',
}) => {
  const shopName = settings.shop_name || 'வில்மணி ஸ்டோர்';
  const shopAddress = settings.shop_address || 'No. 42, Bazaar Main Road, Tamil Nadu';
  const shopPhone = settings.shop_phone || '+91 98765 43210';
  const shopGstin = settings.shop_gstin || '';
  const footerMessage = settings.receipt_footer || 'நன்றி! மீண்டும் வருக.\nTHANK YOU! VISIT AGAIN.';

  // Format Date and Time in Indian Standard Time (IST - Asia/Kolkata)
  const parseDateToIST = (input?: string | Date | null): Date => {
    if (!input) return new Date();
    if (input instanceof Date) return input;
    const str = String(input).trim();
    if (!str.endsWith('Z') && !str.includes('+') && str.includes(':')) {
      return new Date(str.replace(' ', 'T') + 'Z');
    }
    return new Date(str);
  };

  const dateObj = parseDateToIST(bill.created_at);
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Calculate total items count and total quantity
  const totalItemCount = items.length;
  const totalQuantityCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // 4-inch Thermal Paper Layout (100mm roll, ~96mm printable width)
  const containerWidthStyle = { width: '96mm', maxWidth: '100mm' };

  return (
    <div
      id="thermal-receipt-printable"
      className="bg-white text-black mx-auto select-text leading-tight"
      style={{
        ...containerWidthStyle,
        boxSizing: 'border-box',
        padding: '2.5mm 2mm',
        margin: '0 auto',
        fontFamily: "'Noto Sans Tamil', 'Mukta Malar', 'Nirmala UI', 'Latha', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        fontSize: '11.5px',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {/* 1. STORE HEADER */}
      <div className="text-center pb-1">
        <h1
          className="font-extrabold uppercase tracking-tight leading-tight"
          style={{ fontSize: '15px', margin: '0 0 2px 0' }}
        >
          {shopName}
        </h1>
        {shopAddress && (
          <p
            className="whitespace-pre-line font-medium leading-tight"
            style={{ fontSize: '10.5px', margin: '1px 0' }}
          >
            {shopAddress}
          </p>
        )}
        {shopPhone && (
          <p className="font-semibold" style={{ fontSize: '10.5px', margin: '1px 0' }}>
            Ph: {shopPhone}
          </p>
        )}
        {shopGstin && (
          <p
            className="font-mono font-medium tracking-wide"
            style={{ fontSize: '10px', margin: '1px 0' }}
          >
            GSTIN: {shopGstin}
          </p>
        )}
      </div>

      {/* 2. TAX INVOICE BANNER */}
      <div
        className="text-center font-bold tracking-widest uppercase my-1.5 py-0.5"
        style={{
          fontSize: '11px',
          borderTop: '1.5px solid #000000',
          borderBottom: '1.5px solid #000000',
          letterSpacing: '2px',
        }}
      >
        TAX INVOICE
      </div>

      {/* 3. BILL DETAILS - 2-Column Structured Table */}
      <table
        className="w-full border-collapse my-1"
        style={{ tableLayout: 'fixed', fontSize: '10.5px' }}
      >
        <tbody>
          <tr>
            <td className="text-left py-0.5" style={{ width: '58%' }}>
              <span>Bill No: </span>
              <strong className="font-bold">{bill.bill_number}</strong>
            </td>
            <td className="text-right py-0.5" style={{ width: '42%' }}>
              <span>Date: </span>
              <span className="font-medium">{dateStr}</span>
            </td>
          </tr>
          <tr>
            <td
              className="text-left py-0.5"
              style={{
                width: '58%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <span>Customer: </span>
              <span className="font-medium">{bill.customer_name || 'Walk-in'}</span>
            </td>
            <td className="text-right py-0.5" style={{ width: '42%' }}>
              <span>Time: </span>
              <span className="font-medium">{timeStr}</span>
            </td>
          </tr>
          {bill.customer_phone && (
            <tr>
              <td colSpan={2} className="text-left py-0.5">
                <span>Mobile: </span>
                <span className="font-mono font-medium">{bill.customer_phone}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 4. ITEM TABLE (S.No | Item Name | Quantity | Price | Amount) */}
      <div style={{ marginTop: '4px', marginBottom: '4px' }}>
        <table
          className="w-full border-collapse"
          style={{
            tableLayout: 'fixed',
            fontSize: '10.5px',
            borderTop: '1.5px solid #000000',
            borderBottom: '1.5px solid #000000',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <th
                className="text-center py-1 font-bold"
                style={{ width: '9%', padding: '2px 1px' }}
              >
                எண்
              </th>
              <th
                className="text-left py-1 font-bold"
                style={{ width: '43%', padding: '2px 4px' }}
              >
                பொருள்
              </th>
              <th
                className="text-center py-1 font-bold"
                style={{ width: '15%', padding: '2px 2px' }}
              >
                அளவு
              </th>
              <th
                className="text-right py-1 font-bold"
                style={{ width: '16%', padding: '2px 2px' }}
              >
                விலை
              </th>
              <th
                className="text-right py-1 font-bold"
                style={{ width: '17%', padding: '2px 2px' }}
              >
                மொத்தம்
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const primaryName =
                item.product_name_tamil && item.product_name_tamil.trim()
                  ? item.product_name_tamil.trim()
                  : item.product_name || 'Item';

              const secondaryName =
                item.product_name_tamil && item.product_name_tamil.trim() && item.product_name && item.product_name !== item.product_name_tamil
                  ? item.product_name
                  : null;

              return (
                <tr
                  key={index}
                  style={{
                    borderBottom:
                      index === items.length - 1 ? 'none' : '1px dashed #d1d5db',
                  }}
                >
                  {/* S.No */}
                  <td
                    className="text-center align-top font-mono font-medium"
                    style={{ width: '9%', padding: '3px 1px' }}
                  >
                    {index + 1}
                  </td>

                  {/* Item Name (Tamil primary, English / Unit subtitle) */}
                  <td
                    className="text-left align-top leading-tight"
                    style={{
                      width: '43%',
                      padding: '3px 4px',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    <span
                      className="font-bold text-black block"
                      style={{
                        fontSize: '11px',
                        lineHeight: '1.25',
                        fontFamily: "'Noto Sans Tamil', 'Mukta Malar', 'Nirmala UI', sans-serif",
                      }}
                    >
                      {primaryName}
                    </span>
                    {secondaryName && (
                      <span
                        className="text-neutral-700 block font-normal"
                        style={{ fontSize: '9.5px', lineHeight: '1.15' }}
                      >
                        {secondaryName}
                      </span>
                    )}
                    {item.unit && item.unit !== 'pcs' && (
                      <span
                        className="text-neutral-600 block"
                        style={{ fontSize: '9px' }}
                      >
                        ({item.unit})
                      </span>
                    )}
                  </td>

                  {/* Quantity (Pieces as Integer, Weighed/Decimal as 3 Decimal Points) */}
                  <td
                    className="text-center align-top font-mono font-semibold"
                    style={{ width: '15%', padding: '3px 2px', fontSize: '10.5px' }}
                  >
                    {formatPrintBillQty(item.quantity, item.unit)}
                  </td>

                  {/* Price */}
                  <td
                    className="text-right align-top font-mono"
                    style={{ width: '15%', padding: '3px 2px', fontSize: '10.5px' }}
                  >
                    {Number(item.price).toFixed(2).replace(/\.00$/, '')}
                  </td>

                  {/* Total */}
                  <td
                    className="text-right align-top font-mono font-bold"
                    style={{ width: '18%', padding: '3px 2px', fontSize: '11px' }}
                  >
                    {Number(item.total).toFixed(2).replace(/\.00$/, '')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. TOTALS SECTION */}
      <div className="space-y-0.5" style={{ fontSize: '10.5px' }}>
        {/* Total Items & Qty count summary */}
        <div
          className="flex justify-between items-center py-0.5 font-medium text-neutral-800"
          style={{ fontSize: '10px' }}
        >
          <span>மொத்த பொருட்கள் (Items): {totalItemCount}</span>
          <span>
            மொத்த எண்ணிக்கை (Qty):{' '}
            {totalQuantityCount % 1 === 0
              ? totalQuantityCount.toFixed(0)
              : totalQuantityCount.toFixed(3)}
          </span>
        </div>

        {/* Discount (if applicable) */}
        {Number(bill.discount || 0) > 0 && (
          <div className="flex justify-between items-center py-0.5 text-neutral-900">
            <span>
              தள்ளுபடி (Discount)
              {bill.discount_type === 'percentage' ? ` (${bill.discount}%)` : ''}:
            </span>
            <span className="font-mono font-bold">
              - ₹{Number(bill.discount).toFixed(2)}
            </span>
          </div>
        )}

        {/* Tax / GST (if applicable) */}
        {Number(bill.tax || 0) > 0 && (
          <div className="flex justify-between items-center py-0.5 text-neutral-900">
            <span>
              வரி / GST {bill.tax_percentage ? `(${bill.tax_percentage}%)` : ''}:
            </span>
            <span className="font-mono font-bold">
              + ₹{Number(bill.tax).toFixed(2)}
            </span>
          </div>
        )}

        {/* GRAND TOTAL BAR */}
        <div
          className="flex justify-between items-center my-1.5 py-1"
          style={{
            borderTop: '2px solid #000000',
            borderBottom: '2px solid #000000',
          }}
        >
          <span
            className="font-extrabold uppercase tracking-wide"
            style={{ fontSize: '12px' }}
          >
            மொத்தம் (TOTAL)
          </span>
          <span
            className="font-mono font-black"
            style={{ fontSize: '14px' }}
          >
            ₹{Number(bill.grand_total || 0).toFixed(2)}
          </span>
        </div>

        {bill.payment_reference && (
          <div
            className="flex justify-between items-center py-0.5 text-neutral-800"
            style={{ fontSize: '10px' }}
          >
            <span>Ref / Note:</span>
            <span className="font-mono font-medium">{bill.payment_reference}</span>
          </div>
        )}
      </div>

      {/* 6. FOOTER */}
      <div
        className="text-center pt-2 pb-1 mt-2 border-t border-dashed border-black space-y-1"
        style={{ fontSize: '10.5px' }}
      >
        <p className="font-bold whitespace-pre-line leading-tight">
          {footerMessage}
        </p>
        <p
          className="font-mono text-neutral-700 tracking-wide"
          style={{ fontSize: '9px', marginTop: '3px' }}
        >
          *** QuickBill POS System ***
        </p>
      </div>
    </div>
  );
};
