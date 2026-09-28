import QRCode from 'qrcode';

/**
 * Validates whether a given string is a syntactically valid UPI VPA ID
 * e.g. vilmanitraders1386@iob, 9876543210@paytm, merchant@okaxis
 */
export function isValidUpiId(upiId?: string): boolean {
  if (!upiId) return false;
  const clean = upiId.trim();
  // Standard NPCI UPI VPA format: username@bankhandle
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(clean);
}

export interface UpiUriOptions {
  upiId: string;
  payeeName?: string;
  amount?: number;
  billNumber?: string;
  note?: string;
}

/**
 * Builds standard NPCI-compliant UPI Payment URI
 * Format: upi://pay?pa=<UPI_ID>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>
 */
export function buildUpiPaymentUri(options: UpiUriOptions): string {
  const { upiId, payeeName, amount, billNumber, note } = options;
  if (!upiId) return '';

  const cleanUpi = upiId.trim();
  const cleanPayee = (payeeName || 'Store').trim();

  const params = new URLSearchParams();
  params.set('pa', cleanUpi);
  params.set('pn', cleanPayee);

  if (typeof amount === 'number' && amount > 0) {
    params.set('am', amount.toFixed(2));
    params.set('cu', 'INR');
  }

  const transactionNote = note || (billNumber ? `Invoice ${billNumber}` : 'POS Payment');
  if (transactionNote) {
    params.set('tn', transactionNote.slice(0, 50));
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Encodes a UPI URI string into a High-Quality PNG Data URL using QR Code library
 */
export async function generateUpiQrDataUrl(
  upiUri: string,
  options?: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    darkColor?: string;
    lightColor?: string;
  }
): Promise<string> {
  if (!upiUri) return '';

  return QRCode.toDataURL(upiUri, {
    width: options?.width || 280,
    margin: options?.margin !== undefined ? options?.margin : 1,
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    color: {
      dark: options?.darkColor || '#000000',
      light: options?.lightColor || '#FFFFFF',
    },
  });
}
