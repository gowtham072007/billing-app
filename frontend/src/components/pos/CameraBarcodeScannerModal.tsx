import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw, Zap, ZapOff, CheckCircle2, AlertCircle, Barcode, Check } from 'lucide-react';
import { posSounds } from '../../utils/soundEffects';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => Promise<boolean> | boolean;
  defaultAutoClose?: boolean;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  defaultAutoClose = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningActiveRef = useRef<boolean>(false);
  const zxingReaderRef = useRef<any>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [autoCloseOnScan, setAutoCloseOnScan] = useState<boolean>(defaultAutoClose);
  const [lastScanned, setLastScanned] = useState<{ code: string; status: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');

  // Stop camera tracks and cancel all scanning
  const stopCamera = useCallback(() => {
    isScanningActiveRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.reset();
      } catch {}
      zxingReaderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Process detected barcode string
  const handleBarcodeDetected = useCallback(async (rawCode: string) => {
    if (!rawCode || !rawCode.trim()) return;
    const cleanCode = rawCode.trim();

    // Prevent duplicate triggers
    if (!isScanningActiveRef.current && autoCloseOnScan) return;

    if (autoCloseOnScan) {
      isScanningActiveRef.current = false;
      stopCamera();
    }

    setIsProcessing(true);

    try {
      const success = await onScan(cleanCode);

      if (success) {
        posSounds.playBeepSuccess();
        setLastScanned({
          code: cleanCode,
          status: 'success',
          message: `Added: ${cleanCode}`,
        });
      } else {
        posSounds.playBeepError();
        setLastScanned({
          code: cleanCode,
          status: 'error',
          message: `Code: ${cleanCode}`,
        });
      }

      // Auto-close camera modal immediately after 1 scan
      if (autoCloseOnScan) {
        onClose();
      }
    } catch {
      posSounds.playBeepError();
      if (autoCloseOnScan) {
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onScan, autoCloseOnScan, onClose, stopCamera]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage('');
    setHasCameraPermission(null);
    isScanningActiveRef.current = true;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasCameraPermission(true);

        // Check torch capabilities
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
          setHasTorch(Boolean(capabilities.torch));
        }

        // Start scanning loop
        startDetectionLoop();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setHasCameraPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device found on this system.');
      } else {
        setErrorMessage(err.message || 'Unable to start camera.');
      }
    }
  }, [facingMode, stopCamera]);

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  };

  // Detection loop using native BarcodeDetector API or Canvas ZXing fallback
  const startDetectionLoop = () => {
    const hasNativeBarcodeDetector = 'BarcodeDetector' in window;
    let detector: any = null;

    if (hasNativeBarcodeDetector) {
      try {
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        detector = new BarcodeDetectorClass({
          formats: [
            'code_128',
            'code_39',
            'code_93',
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'qr_code',
            'data_matrix',
            'itf',
            'codabar',
          ],
        });
      } catch (e) {
        console.warn('Native BarcodeDetector initialization warning:', e);
      }
    }

    const scanFrame = async () => {
      if (!isScanningActiveRef.current) return;

      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && isScanningActiveRef.current) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleBarcodeDetected(rawValue);
              return;
            }
          }
        } catch {
          // Ignore frame decode errors
        }
      }

      if (isScanningActiveRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setLastScanned(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || isProcessing) return;
    const code = manualCode.trim();
    setManualCode('');
    await handleBarcodeDetected(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Live Barcode Scanner
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {autoCloseOnScan ? '1-Time Scan' : 'Continuous'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {autoCloseOnScan ? 'Scan 1 item to add and auto-close camera' : 'Point camera at product barcode or SKU'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black flex-1 min-h-[280px] max-h-[380px] overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />

          {/* Scanner Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened edges backdrop */}
            <div className="relative w-64 h-44 sm:w-72 sm:h-48 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>

              {/* Animated Scanning Laser Line */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse top-1/2 -translate-y-1/2"></div>

              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-[11px] font-semibold text-emerald-300 bg-slate-950/80 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  Align Barcode Inside Box
                </span>
              </div>
            </div>
          </div>

          {/* Camera Controls Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                  isTorchOn ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-900/80 text-slate-300 hover:text-white'
                }`}
                title="Toggle Flashlight"
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
              className="p-2 bg-slate-900/80 text-slate-300 hover:text-white rounded-xl backdrop-blur-md transition-all"
              title="Flip Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Error Message if Camera Permission Denied */}
          {hasCameraPermission === false && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <h4 className="text-white font-bold text-sm mb-1">Camera Access Needed</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">{errorMessage}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera Access
              </button>
            </div>
          )}

          {/* Last Scanned Status Pill */}
          {lastScanned && (
            <div
              className={`absolute top-3 left-3 right-16 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md animate-fade-in ${
                lastScanned.status === 'success'
                  ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/40'
                  : 'bg-rose-950/90 text-rose-200 border border-rose-500/40'
              }`}
            >
              {lastScanned.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span className="truncate">{lastScanned.message}</span>
            </div>
          )}
        </div>

        {/* Footer Controls & Manual Input Fallback */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 space-y-3">
          {/* Auto-close Mode Toggle */}
          <div className="flex items-center justify-between text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoCloseOnScan}
                onChange={e => setAutoCloseOnScan(e.target.checked)}
                className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-200">Auto-close camera on 1 scan</span>
            </label>
          </div>

          {/* Manual Barcode Input Fallback */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-2.5 text-slate-400">
                <Barcode className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Type Barcode or SKU manually..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim() || isProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all"
            >
              Add Item
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
