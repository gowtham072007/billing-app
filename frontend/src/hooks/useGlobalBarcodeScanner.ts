import { useEffect, useRef } from 'react';

interface UseGlobalBarcodeScannerOptions {
  onScan: (barcode: string) => void | Promise<void>;
  enabled?: boolean;
  minChars?: number;
  maxIntervalMs?: number; // Max average time between keystrokes to qualify as scanner
  prefix?: string;
  suffix?: string;
}

/**
 * Global Hardware Barcode Scanner Listener Hook
 * Intercepts high-speed HID keyboard emulation from USB/Bluetooth Barcode Readers
 * even when the barcode input is not directly focused.
 */
export function useGlobalBarcodeScanner({
  onScan,
  enabled = true,
  minChars = 2,
  maxIntervalMs = 75,
}: UseGlobalBarcodeScannerOptions) {
  const bufferRef = useRef<Array<{ char: string; time: number }>>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional keys / modifiers
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      const now = Date.now();
      const target = e.target as HTMLElement | null;
      const isBarcodeSpecificInput =
        target &&
        (target.getAttribute('data-barcode-input') === 'true' ||
          target.id === 'pos-barcode-input');

      // If user presses Enter or Tab (Scanner terminator)
      if (e.key === 'Enter' || e.key === 'Tab') {
        const buffer = bufferRef.current;
        if (buffer.length >= minChars) {
          // Calculate average time between keystrokes
          const totalDuration = now - buffer[0].time;
          const avgInterval = totalDuration / buffer.length;

          // If typed rapidly (hardware scanner) or scanned into non-text input or barcode input
          const isFastBurst = avgInterval <= maxIntervalMs;
          const isNonTextInput =
            !target ||
            (target.tagName !== 'INPUT' &&
              target.tagName !== 'TEXTAREA' &&
              target.tagName !== 'SELECT');

          if (isFastBurst || isNonTextInput || isBarcodeSpecificInput) {
            e.preventDefault();
            e.stopPropagation();

            const rawCode = buffer.map(b => b.char).join('').trim();
            bufferRef.current = [];

            if (rawCode.length >= minChars) {
              // If focused in another input and it was a rapid burst, clean up that input
              if (
                target &&
                (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
                !isBarcodeSpecificInput &&
                isFastBurst
              ) {
                const inputEl = target as HTMLInputElement;
                if (inputEl.value.endsWith(rawCode)) {
                  inputEl.value = inputEl.value.slice(0, -rawCode.length);
                }
              }

              onScan(rawCode);
            }
            return;
          }
        }

        // Clear buffer on Enter
        bufferRef.current = [];
        return;
      }

      // Check single printable character
      if (e.key.length === 1) {
        // Clear buffer if pause between keystrokes is too long
        if (bufferRef.current.length > 0) {
          const lastTime = bufferRef.current[bufferRef.current.length - 1].time;
          if (now - lastTime > 200) {
            bufferRef.current = [];
          }
        }

        bufferRef.current.push({ char: e.key, time: now });

        // Auto-clear buffer after 300ms idle
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          bufferRef.current = [];
        }, 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, onScan, minChars, maxIntervalMs]);
}
