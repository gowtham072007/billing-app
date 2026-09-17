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
