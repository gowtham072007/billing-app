// WebUSB & WebSerial Direct ESC/POS Thermal Printer Connection Utility
import { Bill, BillItem, ShopSettings } from '../types';

export interface ConnectedPrinter {
  type: 'usb' | 'serial' | 'system';
  name: string;
  isOnline: boolean;
  device?: any;
}

let activeUsbDevice: any = null;
let activeSerialPort: any = null;

export const DEFAULT_PRINTER_NAME = 'TVS Electronics RP Series / POS-80';

export function getSavedPrinterName(): string {
  try {
    return localStorage.getItem('billing_printer_name') || DEFAULT_PRINTER_NAME;
  } catch {
    return DEFAULT_PRINTER_NAME;
  }
}

export function savePrinterName(name: string): void {
  try {
    localStorage.setItem('billing_printer_name', name.trim());
  } catch {
    // ignore
  }
}

export function getPrinterStatus(): ConnectedPrinter {
  if (activeUsbDevice && activeUsbDevice.opened) {
    return {
      type: 'usb',
      name: activeUsbDevice.productName || getSavedPrinterName(),
      isOnline: true,
      device: activeUsbDevice,
    };
  }

  if (activeSerialPort && activeSerialPort.readable) {
    return {
      type: 'serial',
      name: getSavedPrinterName(),
      isOnline: true,
      device: activeSerialPort,
    };
  }

  return {
    type: 'system',
    name: getSavedPrinterName(),
    isOnline: true,
  };
}

/**
 * Connect to Thermal Printer via WebUSB
 */
export async function connectWebUsbPrinter(): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    if (!('usb' in navigator)) {
      return { success: false, error: 'WebUSB is not supported in this browser. Please use Google Chrome or Microsoft Edge.' };
    }

    const device = await (navigator as any).usb.requestDevice({
      filters: [] // Allow user to pick any connected USB thermal printer
    });

    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    await device.claimInterface(0);

    activeUsbDevice = device;
    const name = device.productName || 'USB Thermal Billing Machine';
    savePrinterName(name);
    return { success: true, name };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to connect USB printer' };
  }
}

/**
 * Connect to Thermal Printer via Web Serial (COM Port / Virtual COM USB)
 */
export async function connectWebSerialPrinter(): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    if (!('serial' in navigator)) {
      return { success: false, error: 'Web Serial is not supported in this browser. Please use Google Chrome or Microsoft Edge.' };
    }

    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });

    activeSerialPort = port;
    const name = 'TVS / Serial Thermal Printer';
    savePrinterName(name);
    return { success: true, name };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to connect Serial printer' };
  }
}

/**
 * Format receipt text into ESC/POS raw bytes
 */
export function formatEscPosReceipt(bill: Bill, items: BillItem[], settings?: Partial<ShopSettings>): Uint8Array {
  const ESC = 0x1b;
  const GS = 0x1d;

  const encoder = new TextEncoder();
  const chunks: number[] = [];

  // Initialize printer
  chunks.push(ESC, 0x40);

  // Center alignment
  chunks.push(ESC, 0x61, 0x01);

  // Double height & width for shop name
  chunks.push(ESC, 0x21, 0x30);
  const shopName = `${settings?.shop_name || 'VILMANI STORE'}\n`;
  chunks.push(...encoder.encode(shopName));

  // Normal text
  chunks.push(ESC, 0x21, 0x00);
  if (settings?.shop_address) {
    chunks.push(...encoder.encode(`${settings.shop_address}\n`));
  }
  if (settings?.shop_phone) {
    chunks.push(...encoder.encode(`Ph: ${settings.shop_phone}\n`));
  }
  chunks.push(...encoder.encode('================================\n'));
  chunks.push(...encoder.encode('TAX INVOICE\n'));
  chunks.push(...encoder.encode('--------------------------------\n'));

  // Left align
  chunks.push(ESC, 0x61, 0x00);
  chunks.push(...encoder.encode(`Bill No: ${bill.bill_number}\n`));
  chunks.push(...encoder.encode(`Date: ${new Date(bill.created_at).toLocaleDateString('en-IN')}  Time: ${new Date(bill.created_at).toLocaleTimeString('en-IN')}\n`));
  chunks.push(...encoder.encode(`Customer: ${bill.customer_name || 'Walk-in'}\n`));
  if (bill.customer_phone) {
    chunks.push(...encoder.encode(`Mobile: ${bill.customer_phone}\n`));
  }
  chunks.push(...encoder.encode('--------------------------------\n'));
  chunks.push(...encoder.encode('ITEM          QTY   RATE   TOTAL\n'));
  chunks.push(...encoder.encode('--------------------------------\n'));

  // Items
  for (const item of items) {
    const printName = item.product_name_tamil && item.product_name_tamil.trim()
      ? item.product_name_tamil.trim()
      : item.product_name || 'Item';
    const name = printName.slice(0, 13).padEnd(14);
    const qty = String(item.quantity).padStart(3);
    const rate = Number(item.price).toFixed(0).padStart(6);
    const total = Number(item.total).toFixed(0).padStart(7);
    chunks.push(...encoder.encode(`${name}${qty} ${rate} ${total}\n`));
  }

  chunks.push(...encoder.encode('--------------------------------\n'));
  chunks.push(...encoder.encode(`Subtotal:                    ${Number(bill.subtotal || 0).toFixed(2)}\n`));
  if (Number(bill.discount) > 0) {
    chunks.push(...encoder.encode(`Discount:                   -${Number(bill.discount).toFixed(2)}\n`));
  }
  if (Number(bill.tax) > 0) {
    chunks.push(...encoder.encode(`Tax:                        +${Number(bill.tax).toFixed(2)}\n`));
  }
  chunks.push(...encoder.encode('--------------------------------\n'));

  // Bold Grand Total
  chunks.push(ESC, 0x45, 0x01); // Bold ON
  chunks.push(ESC, 0x21, 0x10); // Double height
  chunks.push(...encoder.encode(`TOTAL: Rs. ${Number(bill.grand_total || 0).toFixed(2)}\n`));
  chunks.push(ESC, 0x21, 0x00); // Normal
  chunks.push(ESC, 0x45, 0x00); // Bold OFF

  chunks.push(...encoder.encode(`Payment: ${bill.payment_method.toUpperCase()}\n`));
  chunks.push(...encoder.encode('================================\n'));

  // Center alignment for footer
  chunks.push(ESC, 0x61, 0x01);
  chunks.push(...encoder.encode(`${settings?.receipt_footer || 'THANK YOU! VISIT AGAIN.'}\n\n`));

  // Paper feed & Cut (GS V 66 0)
  chunks.push(ESC, 0x64, 0x04); // Feed 4 lines
  chunks.push(GS, 0x56, 0x42, 0x00); // Cut paper

  return new Uint8Array(chunks);
}

/**
 * Send raw print bytes to connected USB or Serial thermal printer
 */
export async function printDirectRaw(bill: Bill, items: BillItem[], settings?: Partial<ShopSettings>): Promise<boolean> {
  const data = formatEscPosReceipt(bill, items, settings);

  if (activeUsbDevice && activeUsbDevice.opened) {
    try {
      const endpoint = activeUsbDevice.configuration?.interfaces[0]?.alternate?.endpoints?.find(
        (e: any) => e.direction === 'out'
      );
      const endpointNumber = endpoint ? endpoint.endpointNumber : 1;
      await activeUsbDevice.transferOut(endpointNumber, data);
      return true;
    } catch (err) {
      console.error('USB print failed:', err);
    }
  }

  if (activeSerialPort && activeSerialPort.writable) {
    try {
      const writer = activeSerialPort.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();
      return true;
    } catch (err) {
      console.error('Serial print failed:', err);
    }
  }

  return false;
}

/**
 * Print receipt using an isolated hidden iframe so only the receipt content is sent to the printer
 * with 100% pixel-perfect matching styling to the on-screen preview.
 */
export function printReceiptElement(elementId: string = 'thermal-receipt-printable'): void {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    window.print();
    return;
  }

  // Remove any previously created print iframes
  const oldIframe = document.getElementById('thermal-print-iframe');
  if (oldIframe) {
    oldIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'thermal-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Extract cloned receipt HTML
  const receiptHtml = originalElement.outerHTML;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt</title>
        <style>
          @page {
            size: auto;
            margin: 0mm !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            margin: 0;
            padding: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #thermal-receipt-printable {
            width: 76mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 3mm 2mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .flex {
            display: flex !important;
          }
          .justify-between {
            justify-content: space-between !important;
          }
          .items-center {
            align-items: center !important;
          }
          .text-center {
            text-align: center !important;
          }
          .text-left {
            text-align: left !important;
          }
          .text-right {
            text-align: right !important;
          }
          .font-black, .font-extrabold {
            font-weight: 900 !important;
          }
          .font-bold {
            font-weight: 700 !important;
          }
          .font-medium {
            font-weight: 500 !important;
          }
          .font-mono {
            font-family: "Courier New", Courier, Consolas, monospace !important;
          }
          .font-sans {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          .uppercase {
            text-transform: uppercase !important;
          }
          .tracking-wider {
            letter-spacing: 0.05em !important;
          }
          .tracking-widest {
            letter-spacing: 0.15em !important;
          }
          .whitespace-pre-line {
            white-space: pre-line !important;
          }
          .break-words {
            word-break: break-word !important;
          }
          .block {
            display: block !important;
          }
          .border-t {
            border-top: 1px solid #000000 !important;
          }
          .border-b {
            border-bottom: 1px solid #000000 !important;
          }
          .border-black {
            border-color: #000000 !important;
          }
          .border-dashed {
            border-style: dashed !important;
          }
          .my-1 {
            margin-top: 4px !important;
            margin-bottom: 4px !important;
          }
          .mt-0\\.5 {
            margin-top: 2px !important;
          }
          .mt-1 {
            margin-top: 4px !important;
          }
          .mt-2 {
            margin-top: 8px !important;
          }
          .pt-0\\.5 {
            padding-top: 2px !important;
          }
          .pt-1 {
            padding-top: 4px !important;
          }
          .pt-3 {
            padding-top: 8px !important;
          }
          .pb-1 {
            padding-bottom: 4px !important;
          }
          .pb-2 {
            padding-bottom: 6px !important;
          }
          .py-0\\.5 {
            padding-top: 2px !important;
            padding-bottom: 2px !important;
          }
          .py-1 {
            padding-top: 3px !important;
            padding-bottom: 3px !important;
          }
          .py-1\\.5 {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
          }
          .space-y-0\\.5 > * + * {
            margin-top: 2px !important;
          }
          .space-y-1 > * + * {
            margin-top: 4px !important;
          }
          .text-sm {
            font-size: 13px !important;
          }
          .text-base {
            font-size: 14px !important;
          }
          .text-\\[8px\\] {
            font-size: 8px !important;
          }
          .text-\\[9px\\] {
            font-size: 9px !important;
          }
          .text-\\[10px\\] {
            font-size: 10px !important;
          }
          .text-\\[11px\\] {
            font-size: 11px !important;
          }
          .text-\\[12px\\] {
            font-size: 12px !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            padding: 3px 0 !important;
          }
          .align-top {
            vertical-align: top !important;
          }
          .divide-y > * + * {
            border-top: 1px dotted #ccc !important;
          }
        </style>
      </head>
      <body>
        ${receiptHtml}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 250);
}
