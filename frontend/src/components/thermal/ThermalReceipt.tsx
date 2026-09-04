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

  const widthClass =
    paperWidth === '58mm'
      ? 'w-[58mm] max-w-[58mm]'
      : paperWidth === '100mm'
      ? 'w-[100mm] max-w-[100mm]'
      : 'w-[80mm] max-w-[80mm]';

  return (
    <div
      id="thermal-receipt-printable"
      className={`bg-white text-black font-sans text-[11px] leading-tight p-2 sm:p-3 mx-auto border border-dashed border-slate-300 print:border-none print:p-1 select-text ${widthClass}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Header Section */}
      <div className="text-center pb-2">
        <h2 className="text-sm sm:text-base font-black uppercase tracking-wider">{shopName}</h2>
        <p className="text-[10px] sm:text-[11px] whitespace-pre-line mt-0.5">{shopAddress}</p>
        <p className="text-[10px] sm:text-[11px] mt-0.5">Ph: {shopPhone}</p>
        {shopGstin && <p className="text-[10px] mt-0.5">GSTIN: {shopGstin}</p>}
      </div>

      <div className="text-center font-black tracking-widest text-[12px] my-1 border-t border-b border-black py-0.5">
        TAX INVOICE
      </div>

      {/* Bill Meta Info */}
      <div className="text-[10px] sm:text-[11px] space-y-0.5 py-1 font-mono">
        <div className="flex justify-between">
          <span>Bill No: <strong className="font-bold text-black">{bill.bill_number}</strong></span>
          <span>Date: {dateStr}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer: {bill.customer_name || 'Walk-in'}</span>
          <span>Time: {timeStr}</span>
        </div>
        {bill.customer_phone && (
          <div>
            <span>Mobile: {bill.customer_phone}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-black my-1 border-dashed"></div>

      {/* Items Table - Product Name Printed in Tamil / English */}
      <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse">
        <thead>
          <tr className="border-b border-black text-[10px] font-bold">
            <th className="py-1 text-left w-[46%]">பொருள்</th>
            <th className="py-1 text-center w-[14%]">அளவு</th>
            <th className="py-1 text-right w-[18%]">விலை</th>
            <th className="py-1 text-right w-[22%]">மொத்தம்</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dotted divide-slate-300">
          {items.map((item, index) => {
            const printName = item.product_name_tamil && item.product_name_tamil.trim()
              ? item.product_name_tamil.trim()
              : item.product_name;

            return (
              <tr key={index} className="print:border-none">
                <td className="py-1.5 pr-1 break-words leading-tight">
                  <span className="font-extrabold text-black block text-[11px] sm:text-[12px] leading-snug">
                    {printName}
                  </span>
                  {item.unit && item.unit !== 'pcs' && (
                    <span className="text-[9px] text-slate-600 block font-medium mt-0.5">
                      ({item.unit})
                    </span>
                  )}
                </td>
                <td className="py-1.5 text-center font-mono font-bold align-top">{item.quantity}</td>
                <td className="py-1.5 text-right font-mono align-top">{Number(item.price).toFixed(2)}</td>
                <td className="py-1.5 text-right font-mono font-bold align-top">
                  {Number(item.total).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Divider */}
      <div className="border-t border-black my-1 border-dashed"></div>

      {/* Calculations & Totals */}
      <div className="text-[10px] sm:text-[11px] space-y-1 font-mono">
        <div className="flex justify-between">
          <span>கூட்டுத்தொகை (Subtotal):</span>
          <span className="font-bold">{Number(bill.subtotal || 0).toFixed(2)}</span>
        </div>

        {Number(bill.discount || 0) > 0 && (
          <div className="flex justify-between text-slate-700">
            <span>தள்ளுபடி (Discount) {bill.discount_type === 'percentage' ? `(${bill.discount}%)` : ''}:</span>
            <span>- {Number(bill.discount).toFixed(2)}</span>
          </div>
        )}

        {Number(bill.tax || 0) > 0 && (
          <div className="flex justify-between text-slate-700">
            <span>வரி (Tax) {bill.tax_percentage ? `(${bill.tax_percentage}%)` : ''}:</span>
            <span>+ {Number(bill.tax).toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-black my-1"></div>

        <div className="flex justify-between items-center text-xs sm:text-sm font-black pt-0.5">
          <span>மொத்தத் தொகை (TOTAL)</span>
          <span className="font-mono text-sm sm:text-base font-black">
            ₹{Number(bill.grand_total || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-[10px] pt-1">
          <span>பணம் செலுத்திய முறை:</span>
          <span className="uppercase font-bold">{bill.payment_method || 'CASH'}</span>
        </div>
        {bill.payment_reference && (
          <div className="flex justify-between text-[9px] text-slate-600">
            <span>Ref:</span>
            <span className="font-mono">{bill.payment_reference}</span>
          </div>
        )}
      </div>

      {/* Footer message */}
      <div className="text-center pt-3 pb-1 border-t border-black mt-2 text-[10px] font-bold whitespace-pre-line">
        <p>{footerMessage}</p>
        <p className="text-[8px] text-slate-500 font-mono mt-1">
          *** Software: QuickBill POS System ***
        </p>
      </div>
    </div>
  );
};
