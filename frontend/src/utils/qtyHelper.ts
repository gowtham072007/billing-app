/**
 * QTY (Quantity) Type Format and Unit Helpers
 * Provides unit classification, clean formatting, step calculation, and quick preset values.
 */

// Weight and volume units that typically support fractional / decimal values
const DECIMAL_UNITS = new Set([
  'kg',
  'g',
  'gram',
  'grams',
  'kilogram',
  'kilograms',
  'l',
  'liter',
  'liters',
  'litre',
  'litres',
  'ml',
  'milliliter',
  'meter',
  'meters',
  'm',
  'sqft',
  'yard',
]);

/**
 * Standard English to Tamil unit translation mapping for billing and receipts
 */
export const UNIT_TAMIL_MAP: Record<string, string> = {
  // Weight
  kg: 'கிலோ',
  kilogram: 'கிலோ',
  kilograms: 'கிலோ',
  g: 'கிராம்',
  gram: 'கிராம்',
  grams: 'கிராம்',
  gm: 'கிராம்',
  gms: 'கிராம்',
  mg: 'மி.கி',
  milligram: 'மி.கி',
  milligrams: 'மி.கி',
  ton: 'டன்',
  quintal: 'குவிண்டால்',

  // Volume & Liquid
  l: 'லிட்டர்',
  liter: 'லிட்டர்',
  liters: 'லிட்டர்',
  litre: 'லிட்டர்',
  litres: 'லிட்டர்',
  ltr: 'லிட்டர்',
  ml: 'மி.லி',
  milliliter: 'மி.லி',
  milliliters: 'மி.லி',
  can: 'கேன்',
  tin: 'டின்',
  bottle: 'பாட்டில்',
  bottles: 'பாட்டில்',

  // Piece & Package
  pcs: 'பீஸ்',
  pc: 'பீஸ்',
  piece: 'பீஸ்',
  pieces: 'பீஸ்',
  nos: 'எண்',
  no: 'எண்',
  number: 'எண்',
  numbers: 'எண்',
  packet: 'பாக்கெட்',
  packets: 'பாக்கெட்',
  pack: 'பேக்',
  packs: 'பேக்',
  pkt: 'பாக்கெட்',
  pkts: 'பாக்கெட்',
  bag: 'பை',
  bags: 'பை',
  box: 'பெட்டி',
  boxes: 'பெட்டி',
  carton: 'கார்டன்',
  bundle: 'கட்டு',
  bundles: 'கட்டு',
  bndl: 'கட்டு',
  doz: 'டஜன்',
  dozen: 'டஜன்',
  set: 'செட்',
  sets: 'செட்',
  pair: 'ஜோடி',
  pairs: 'ஜோடி',
  roll: 'ரோல்',
  rolls: 'ரோல்',

  // Length & Area
  meter: 'மீட்டர்',
  meters: 'மீட்டர்',
  m: 'மீட்டர்',
  cm: 'செ.மீ',
  mm: 'மி.மீ',
  inch: 'இன்ச்',
  inches: 'இன்ச்',
  ft: 'அடி',
  feet: 'அடி',
  yard: 'கஜம்',
  sqft: 'ச.அடி',
  sqm: 'ச.மீ',
};

/**
 * Returns the Tamil translation of a unit of measurement.
 * If no translation exists or it's already Tamil, returns the cleaned original unit.
 */
export function getTamilUnit(unit?: string): string {
  if (!unit) return 'பீஸ்';
  const clean = unit.trim();
  const lower = clean.toLowerCase();
  return UNIT_TAMIL_MAP[lower] || clean;
}

/**
 * Checks whether a given unit string supports decimal/fractional quantities
 */
export function isDecimalUnit(unit?: string): boolean {
  if (!unit) return false;
  const clean = unit.trim().toLowerCase();
  return DECIMAL_UNITS.has(clean);
}

/**
 * Returns preset quantity options tailored to the unit of measurement
 */
export function getQtyPresets(unit?: string): Array<{ label: string; value: number }> {
  const clean = (unit || 'pcs').trim().toLowerCase();

  if (clean === 'kg' || clean === 'kilogram' || clean === 'kilograms') {
    return [
      { label: '¼ kg (250g)', value: 0.25 },
      { label: '½ kg (500g)', value: 0.5 },
      { label: '¾ kg (750g)', value: 0.75 },
      { label: '1 kg', value: 1 },
      { label: '2 kg', value: 2 },
      { label: '5 kg', value: 5 },
      { label: '10 kg', value: 10 },
      { label: '25 kg (Bag)', value: 25 },
    ];
  }

  if (clean === 'g' || clean === 'gram' || clean === 'grams') {
    return [
      { label: '50 g', value: 50 },
      { label: '100 g', value: 100 },
      { label: '250 g', value: 250 },
      { label: '500 g', value: 500 },
      { label: '1000 g', value: 1000 },
    ];
  }

  if (clean === 'l' || clean === 'litre' || clean === 'litres' || clean === 'liter' || clean === 'liters') {
    return [
      { label: '½ L (500ml)', value: 0.5 },
      { label: '1 L', value: 1 },
      { label: '2 L', value: 2 },
      { label: '5 L (Can)', value: 5 },
      { label: '15 L (Tin)', value: 15 },
    ];
  }

  if (clean === 'ml' || clean === 'milliliter') {
    return [
      { label: '100 ml', value: 100 },
      { label: '200 ml', value: 200 },
      { label: '500 ml', value: 500 },
      { label: '750 ml', value: 750 },
      { label: '1000 ml', value: 1000 },
    ];
  }

  if (clean === 'meter' || clean === 'm' || clean === 'yard') {
    return [
      { label: '0.5 m', value: 0.5 },
      { label: '1 m', value: 1 },
      { label: '2 m', value: 2 },
      { label: '5 m', value: 5 },
      { label: '10 m', value: 10 },
    ];
  }

  // Discrete count units (pcs, box, pack, packet, nos, etc.)
  return [
    { label: '1 pcs', value: 1 },
    { label: '2 pcs', value: 2 },
    { label: '3 pcs', value: 3 },
    { label: '5 pcs', value: 5 },
    { label: '10 pcs', value: 10 },
    { label: '12 (1 Doz)', value: 12 },
    { label: '24 (2 Doz)', value: 24 },
    { label: '50 (Bulk)', value: 50 },
  ];
}

/**
 * Returns default step increment for stepper buttons
 */
export function getStepIncrement(unit?: string, isShiftKey = false): number {
  const isDec = isDecimalUnit(unit);
  if (isShiftKey) {
    return isDec ? 0.1 : 5;
  }
  return isDec ? 0.25 : 1;
}

/**
 * Formats a quantity value cleanly without floating point inaccuracies
 * e.g., 1 -> "1", 1.5 -> "1.5", 0.25 -> "0.25", 1.000 -> "1"
 */
export function formatQtyNumber(quantity: number): string {
  if (typeof quantity !== 'number' || isNaN(quantity)) return '0';
  // Round to max 3 decimal places to remove floating noise
  const rounded = Math.round(quantity * 1000) / 1000;
  return Number(rounded.toFixed(3)).toString();
}

/**
 * Formats quantity with unit suffix e.g., "1.5 kg", "2 pcs", "0.25 L"
 */
export function formatQtyWithUnit(quantity: number, unit?: string): string {
  const numStr = formatQtyNumber(quantity);
  const u = (unit || 'pcs').trim();
  return `${numStr} ${u}`;
}

/**
 * Formats quantity specifically for printed bills:
 * - Piece-based / discrete count units (pcs, piece, box, packet, nos, etc.) print as an INTEGER (e.g. 1, 2, 5, 12).
 * - Weight / volume / length units (kg, g, L, ml, meter, etc.) or fractional amounts print with 3 decimal points (e.g. 0.500, 1.250, 0.250).
 */
export function formatPrintBillQty(quantity: number, unit?: string): string {
  const q = typeof quantity === 'number' && !isNaN(quantity) ? quantity : 0;
  const isDec = isDecimalUnit(unit);

  if (isDec || q % 1 !== 0) {
    return q.toFixed(3);
  }

  return String(Math.round(q));
}

/**
 * Formats quantity with product unit for bill receipts e.g. "1 pcs", "0.500 kg", "1.250 L"
 */
export function formatPrintBillQtyWithUnit(quantity: number, unit?: string): string {
  const qtyStr = formatPrintBillQty(quantity, unit);
  const u = (unit || 'pcs').trim();
  return `${qtyStr} ${u}`;
}

/**
 * Formats quantity with Tamil product unit for bill receipts e.g. "1 பீஸ்", "0.500 கிலோ", "1.250 லிட்டர்"
 */
export function formatPrintBillQtyWithTamilUnit(quantity: number, unit?: string): string {
  const qtyStr = formatPrintBillQty(quantity, unit);
  const u = getTamilUnit(unit);
  return `${qtyStr} ${u}`;
}

/**
 * Formats quantity for customer-facing display with friendly unit fractions
 * e.g.,
 *  - 0.25 kg -> "250g (¼ kg)"
 *  - 0.5 kg -> "500g (½ kg)"
 *  - 0.75 kg -> "750g (¾ kg)"
 *  - 1 kg -> "1 kg"
 *  - 1.5 kg -> "1.5 kg"
 *  - 0.5 L -> "500ml (½ L)"
 *  - 1 pcs -> "1 pcs"
 */
export function formatCustomerQtyDisplay(quantity: number, unit?: string): string {
  if (typeof quantity !== 'number' || isNaN(quantity)) return '0';
  const cleanUnit = (unit || 'pcs').trim();
  const lowerUnit = cleanUnit.toLowerCase();
  const q = Math.round(quantity * 1000) / 1000;

  if (['kg', 'kilogram', 'kilograms'].includes(lowerUnit)) {
    if (q === 0.25) return '250g (¼ kg)';
    if (q === 0.5) return '500g (½ kg)';
    if (q === 0.75) return '750g (¾ kg)';
    if (q < 1 && q > 0) return `${Math.round(q * 1000)}g`;
    return `${formatQtyNumber(q)} kg`;
  }

  if (['l', 'liter', 'liters', 'litre', 'litres', 'ltr'].includes(lowerUnit)) {
    if (q === 0.25) return '250ml (¼ L)';
    if (q === 0.5) return '500ml (½ L)';
    if (q === 0.75) return '750ml (¾ L)';
    if (q < 1 && q > 0) return `${Math.round(q * 1000)}ml`;
    return `${formatQtyNumber(q)} L`;
  }

  return `${formatQtyNumber(q)} ${cleanUnit}`;
}

/**
 * Safely parses string or number input into a clean positive number
 */
export function parseQtyInput(input: string | number, fallback = 1): number {
  if (typeof input === 'number') {
    return isNaN(input) || input <= 0 ? fallback : Math.round(input * 1000) / 1000;
  }
  const parsed = parseFloat(input);
  if (isNaN(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed * 1000) / 1000;
}


