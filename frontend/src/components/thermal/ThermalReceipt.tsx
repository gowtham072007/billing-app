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
  const shopName = settings.shop_name || 'Vilmani Store';
  const shopAddress = settings.shop_address || 'No. 42, Bazaar Main Road, Tamil Nadu';
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

  const previewWidthClass =
    paperWidth === '58mm'
      ? 'max-w-[58mm] w-full'
      : paperWidth === '100mm'
      ? 'max-w-[100mm] w-full'
      : 'max-w-[80mm] w-full';

  return (
    <div
      id="thermal-receipt-printable"
      className={`bg-white text-black font-sans text-xs leading-normal p-2 sm:p-3 mx-auto select-text ${previewWidthClass}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Header Section */}
      <div className="text-center pb-1 space-y-0.5">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-wider leading-tight">
          {shopName}
        </h2>
        <p className="text-[11px] whitespace-pre-line font-medium leading-tight text-black">
          {shopAddress}
        </p>
        <p className="text-[11px] font-semibold text-black">Ph: {shopPhone}</p>
        {shopGstin && (
          <p className="text-[10px] font-mono font-medium text-black">GSTIN: {shopGstin}</p>
        )}
      </div>

      {/* Tax Invoice Banner */}
      <div className="text-center font-bold tracking-widest text-[11px] my-1.5 py-0.5 border-t border-b border-black uppercase">
        TAX INVOICE
      </div>

      {/* Bill Meta Info - Structured 2-Column Table */}
      <table className="w-full text-[11px] font-mono border-collapse my-1" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td className="text-left py-0.5" style={{ width: '60%' }}>
              Bill No: <span className="font-extrabold text-black">{bill.bill_number}</span>
            </td>
            <td className="text-right py-0.5 font-sans" style={{ width: '40%' }}>
              Date: <span className="font-medium">{dateStr}</span>
            </td>
          </tr>
          <tr>
            <td className="text-left py-0.5 truncate" style={{ width: '60%' }}>
              Customer: <span className="font-medium">{bill.customer_name || 'Walk-in'}</span>
            </td>
            <td className="text-right py-0.5 font-sans" style={{ width: '40%' }}>
              Time: <span className="font-medium">{timeStr}</span>
            </td>
          </tr>
          {bill.customer_phone && (
            <tr>
              <td colSpan={2} className="text-left py-0.5">
                Mobile: <span className="font-medium">{bill.customer_phone}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Divider */}
      <div className="border-t border-dashed border-black my-1.5"></div>

      {/* Items Table - Fixed Width Columns with Explicit Separation */}
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="border-b border-black text-[11px] font-bold">
            <th className="py-1 text-left" style={{ width: '38%', paddingRight: '4px' }}>
              பொருள்
            </th>
            <th className="py-1 text-center" style={{ width: '16%', paddingLeft: '2px', paddingRight: '2px' }}>
              அளவு
            </th>
            <th className="py-1 text-right" style={{ width: '22%', paddingRight: '8px' }}>
              விலை
            </th>
            <th className="py-1 text-right" style={{ width: '24%', paddingLeft: '4px' }}>
              மொத்தம்
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const printName =
              item.product_name_tamil && item.product_name_tamil.trim()
                ? item.product_name_tamil.trim()
                : item.product_name;

            return (
              <tr key={index} className="border-b border-dotted border-neutral-300">
                <td className="py-1 text-left align-top leading-tight" style={{ paddingRight: '4px' }}>
                  <span className="font-bold text-black block text-[12px]">
                    {printName}
                  </span>
                  {item.unit && item.unit !== 'pcs' && (
                    <span className="text-[10px] text-neutral-700 block">
                      ({item.unit})
                    </span>
                  )}
                </td>
                <td
                  className="py-1 text-center font-mono font-medium align-top text-[11px]"
                  style={{ paddingLeft: '2px', paddingRight: '2px' }}
                >
                  {item.quantity}
                </td>
                <td
                  className="py-1 text-right font-mono align-top text-[11px]"
                  style={{ paddingRight: '8px' }}
                >
                  {Number(item.price).toFixed(2)}
                </td>
                <td
                  className="py-1 text-right font-mono font-bold align-top text-[11px]"
                  style={{ paddingLeft: '4px' }}
                >
                  {Number(item.total).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Divider */}
      <div className="border-t border-dashed border-black my-1.5"></div>

      {/* Calculations & Totals */}
      <div className="text-[11px] space-y-0.5 font-mono">
        <div className="flex justify-between items-center py-0.5">
          <span>கூட்டுத்தொகை (Subtotal):</span>
          <span className="font-bold">{Number(bill.subtotal || 0).toFixed(2)}</span>
        </div>

        {Number(bill.discount || 0) > 0 && (
          <div className="flex justify-between items-center py-0.5 text-neutral-800">
            <span>
              தள்ளுபடி (Discount){' '}
              {bill.discount_type === 'percentage' ? `(${bill.discount}%)` : ''}:
            </span>
            <span className="font-bold">- {Number(bill.discount).toFixed(2)}</span>
          </div>
        )}

        {Number(bill.tax || 0) > 0 && (
          <div className="flex justify-between items-center py-0.5 text-neutral-800">
            <span>
              வரி (Tax) {bill.tax_percentage ? `(${bill.tax_percentage}%)` : ''}:
            </span>
            <span className="font-bold">+ {Number(bill.tax).toFixed(2)}</span>
          </div>
        )}

        {/* Grand Total Bar */}
        <div className="border-t-2 border-b-2 border-black my-1.5 py-1 flex justify-between items-center">
          <span className="font-black text-xs uppercase tracking-wide">
            மொத்தம் (TOTAL)
          </span>
          <span className="font-mono text-sm sm:text-base font-black">
            ₹{Number(bill.grand_total || 0).toFixed(2)}
          </span>
        </div>

        {/* Payment Details */}
        <div className="flex justify-between items-center py-0.5 text-[11px] font-sans">
          <span>பணம் செலுத்திய முறை:</span>
          <span className="uppercase font-bold">{bill.payment_method || 'CASH'}</span>
        </div>
        {bill.payment_reference && (
          <div className="flex justify-between items-center py-0.5 text-[10px] text-neutral-700 font-sans">
            <span>Ref / Note:</span>
            <span className="font-mono">{bill.payment_reference}</span>
          </div>
        )}
      </div>

      {/* Footer message */}
      <div className="text-center pt-2 pb-1 mt-2 text-[11px] font-bold whitespace-pre-line border-t border-dashed border-black space-y-0.5">
        <p>{footerMessage}</p>
        <p className="text-[9px] text-neutral-600 font-mono font-normal">
          *** Software: QuickBill POS System ***
        </p>
      </div>
    </div>
  );
};
