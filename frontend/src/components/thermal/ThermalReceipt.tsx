import React from 'react';
import { Bill, BillItem, ShopSettings } from '../../types';

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
  paperWidth = '80mm',
}) => {
  const shopName = settings.shop_name || 'VILMANI STORE';
  const shopAddress = settings.shop_address || 'No. 42, Bazaar Main Road, Tamil Nadu - 600001';
  const shopPhone = settings.shop_phone || '+91 98765 43210';
  const shopGstin = settings.shop_gstin || '';
  const footerMessage = settings.receipt_footer || 'நன்றி! மீண்டும் வருக. / THANK YOU! VISIT AGAIN.';

  // Format Date and Time
  const dateObj = bill.created_at ? new Date(bill.created_at) : new Date();
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const widthStyle =
    paperWidth === '58mm'
      ? { width: '58mm', maxWidth: '58mm' }
      : paperWidth === '100mm'
      ? { width: '100mm', maxWidth: '100mm' }
      : { width: '80mm', maxWidth: '80mm' };

  return (
    <div
      id="thermal-receipt-printable"
      className="bg-white text-black font-sans text-xs leading-normal mx-auto select-text print:m-0"
      style={{
        ...widthStyle,
        boxSizing: 'border-box',
        padding: '3mm 4mm 4mm 4mm',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header Section */}
      <div className="text-center pb-1">
        <h2 className="text-base font-black uppercase tracking-tight leading-snug" style={{ color: '#000000' }}>
          {shopName}
        </h2>
        {shopAddress && (
          <p className="text-[10.5px] whitespace-pre-line font-medium leading-tight mt-0.5" style={{ color: '#000000' }}>
            {shopAddress}
          </p>
        )}
        {shopPhone && (
          <p className="text-[10.5px] font-semibold mt-0.5" style={{ color: '#000000' }}>
            Ph: {shopPhone}
          </p>
        )}
        {shopGstin && (
          <p className="text-[10px] font-mono mt-0.5" style={{ color: '#000000' }}>
            GSTIN: {shopGstin}
          </p>
        )}
      </div>

      {/* Title */}
      <div
        className="text-center font-black tracking-wider text-[11px] my-1 py-0.5 uppercase"
        style={{
          borderTop: '1.5px solid #000000',
          borderBottom: '1.5px solid #000000',
          color: '#000000',
        }}
      >
        TAX INVOICE
      </div>

      {/* Bill Meta Info */}
      <div className="text-[10.5px] py-1 font-mono leading-tight" style={{ color: '#000000' }}>
        <div className="flex justify-between font-bold">
          <span>Bill: <span className="font-black">{bill.bill_number}</span></span>
          <span>Date: {dateStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="truncate max-w-[140px]">Cust: {bill.customer_name || 'Walk-in'}</span>
          <span>Time: {timeStr}</span>
        </div>
        {bill.customer_phone && (
          <div>
            <span>Mob: {bill.customer_phone}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div
        className="my-1"
        style={{ borderTop: '1px dashed #000000', width: '100%' }}
      />

      {/* Items Table */}
      <table
        className="w-full text-left text-[11px] border-collapse"
        style={{ tableLayout: 'fixed', color: '#000000' }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1.5px solid #000000',
              fontWeight: 900,
              fontSize: '10.5px',
            }}
          >
            <th className="py-1 text-left" style={{ width: '46%', color: '#000000' }}>பொருள் (ITEM)</th>
            <th className="py-1 text-center" style={{ width: '14%', color: '#000000' }}>அளவு</th>
            <th className="py-1 text-right" style={{ width: '18%', color: '#000000' }}>விலை</th>
            <th className="py-1 text-right" style={{ width: '22%', color: '#000000' }}>மொத்தம்</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const printName =
              item.product_name_tamil && item.product_name_tamil.trim()
                ? item.product_name_tamil.trim()
                : item.product_name;

            return (
              <tr
                key={index}
                style={{
                  borderBottom: index < items.length - 1 ? '1px dotted #888888' : 'none',
                }}
              >
                <td className="py-1 pr-1 break-words leading-tight align-top" style={{ color: '#000000' }}>
                  <span className="font-bold block text-[11.5px] leading-tight" style={{ color: '#000000' }}>
                    {printName}
                  </span>
                  {item.unit && item.unit !== 'pcs' && (
                    <span className="text-[9.5px] block font-medium" style={{ color: '#333333' }}>
                      ({item.unit})
                    </span>
                  )}
                </td>
                <td className="py-1 text-center font-mono font-bold align-top text-[11px]" style={{ color: '#000000' }}>
                  {item.quantity}
                </td>
                <td className="py-1 text-right font-mono align-top text-[11px]" style={{ color: '#000000' }}>
                  {Number(item.price).toFixed(2)}
                </td>
                <td className="py-1 text-right font-mono font-bold align-top text-[11px]" style={{ color: '#000000' }}>
                  {Number(item.total).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Divider */}
      <div
        className="my-1"
        style={{ borderTop: '1px dashed #000000', width: '100%' }}
      />

      {/* Calculations & Totals */}
      <div className="text-[10.5px] space-y-0.5 font-mono" style={{ color: '#000000' }}>
        <div className="flex justify-between">
          <span>கூட்டுத்தொகை (Subtotal):</span>
          <span className="font-bold">{Number(bill.subtotal || 0).toFixed(2)}</span>
        </div>

        {Number(bill.discount || 0) > 0 && (
          <div className="flex justify-between">
            <span>தள்ளுபடி (Discount) {bill.discount_type === 'percentage' ? `(${bill.discount}%)` : ''}:</span>
            <span className="font-bold">- {Number(bill.discount).toFixed(2)}</span>
          </div>
        )}

        {Number(bill.tax || 0) > 0 && (
          <div className="flex justify-between">
            <span>வரி (Tax) {bill.tax_percentage ? `(${bill.tax_percentage}%)` : ''}:</span>
            <span className="font-bold">+ {Number(bill.tax).toFixed(2)}</span>
          </div>
        )}

        {/* Grand Total Bar */}
        <div
          className="my-1 py-1 px-1 flex justify-between items-center text-xs font-black"
          style={{
            borderTop: '2px solid #000000',
            borderBottom: '2px solid #000000',
            color: '#000000',
          }}
        >
          <span className="uppercase text-[11px]">மொத்தத் தொகை (TOTAL)</span>
          <span className="font-mono text-sm sm:text-base font-black">
            ₹{Number(bill.grand_total || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-[10.5px] pt-0.5 font-sans" style={{ color: '#000000' }}>
          <span>பணம் செலுத்திய முறை:</span>
          <span className="uppercase font-bold">{bill.payment_method || 'CASH'}</span>
        </div>
        {bill.payment_reference && (
          <div className="flex justify-between text-[9.5px] font-sans" style={{ color: '#333333' }}>
            <span>Ref / Note:</span>
            <span className="font-mono">{bill.payment_reference}</span>
          </div>
        )}
      </div>

      {/* Footer message */}
      <div
        className="text-center pt-2 pb-1 mt-1 text-[10.5px] font-bold whitespace-pre-line"
        style={{
          borderTop: '1px solid #000000',
          color: '#000000',
        }}
      >
        <p style={{ color: '#000000' }}>{footerMessage}</p>
        <p className="text-[9px] font-mono mt-0.5" style={{ color: '#555555' }}>
          *** QuickBill POS System ***
        </p>
      </div>
    </div>
  );
};

