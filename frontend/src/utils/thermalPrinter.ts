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

  // Collect existing CSS sheets and style tags
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt</title>
        ${styles}
        <style>
          @page {
            size: auto;
            margin: 0mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          #thermal-receipt-printable {
            position: static !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 1mm 1mm !important;
            box-shadow: none !important;
            border: none !important;
            height: auto !important;
          }
        </style>
      </head>
      <body>
        ${originalElement.outerHTML}
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
