/**
 * BarcodeScanner
 *
 * Camera-based barcode scanner for ISBN lookup.
 *
 * Strategy (in order):
 *  1. @zxing/browser BrowserMultiFormatReader — full cross-browser support.
 *  2. Native BarcodeDetector API — Chrome/Edge hardware-accelerated path.
 *  3. Graceful error if camera is unavailable or permission is denied.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
}

type ScannerState = 'idle' | 'requesting' | 'scanning' | 'error';

// Narrow the native BarcodeDetector result type
interface BarcodeDetectorResult {
  rawValue: string;
  format: string;
}
interface BarcodeDetectorAPI {
  detect(source: HTMLVideoElement): Promise<BarcodeDetectorResult[]>;
}

// BarcodeDetector is accessed via (window as any) at runtime to avoid
// TS errors in environments where the type is not available.

const EAN_ISBN_FORMATS = ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e'];

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const nativeRafRef = useRef<number | null>(null);

  const [state, setState] = useState<ScannerState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stopCamera = () => {
    if (nativeRafRef.current !== null) {
      cancelAnimationFrame(nativeRafRef.current);
      nativeRafRef.current = null;
    }
    if (readerRef.current) {
      BrowserMultiFormatReader.releaseAllStreams();
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleScan = (rawValue: string) => {
    const isbn = rawValue.replace(/[^0-9X]/gi, '');
    if (isbn.length === 10 || isbn.length === 13) {
      stopCamera();
      onScan(isbn);
    }
  };

  // ── Native BarcodeDetector scan loop ──────────────────────────────────────
  const startNativeScan = (video: HTMLVideoElement) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = new (window as any).BarcodeDetector({
      formats: EAN_ISBN_FORMATS,
    }) as BarcodeDetectorAPI;

    const tick = async () => {
      if (!streamRef.current) return;
      try {
        const results = await detector.detect(video);
        if (results.length > 0 && results[0]) {
          handleScan(results[0].rawValue);
          return;
        }
      } catch {
        // frame not ready — keep going
      }
      nativeRafRef.current = requestAnimationFrame(() => {
        void tick();
      });
    };

    void tick();
  };

  // ── zxing scan ────────────────────────────────────────────────────────────
  const startZxingScan = async (video: HTMLVideoElement) => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    try {
      await reader.decodeFromVideoElement(video, (result, err) => {
        if (result) {
          handleScan(result.getText());
        } else if (err && !(err instanceof NotFoundException)) {
          // NotFoundException is expected when no barcode is in frame; ignore it.
          console.warn('zxing scan error:', err);
        }
      });
    } catch (err) {
      console.warn('zxing decodeFromVideoElement failed:', err);
      setState('error');
      setErrorMsg(t('books.scanner.errorGeneric', 'Scanner error. Try entering the ISBN manually.'));
    }
  };

  // ── Camera startup ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setState('requesting');

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        if (cancelled) return;
        setState('error');
        setErrorMsg(t('books.scanner.errorPermission', 'Camera access was denied. Please allow camera access and try again.'));
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();
      setState('scanning');

      // Prefer native BarcodeDetector (zero extra bundle cost) if available,
      // fall back to zxing/browser for full cross-browser coverage.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasNative = typeof (window as any).BarcodeDetector !== 'undefined';
      if (hasNative) {
        startNativeScan(video);
      } else {
        void startZxingScan(video);
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('books.scanner.ariaLabel', 'Barcode scanner')}
    >
      <div className="relative w-full max-w-sm bg-[#1A251D] rounded-2xl border border-[#28382D] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#28382D]">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Camera className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
            {t('books.scanner.title', 'Scan Barcode')}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-[#8C9C92] hover:text-white transition-colors"
            aria-label={t('books.scanner.close', 'Close scanner')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-square bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            aria-hidden="true"
          />

          {/* Aiming overlay */}
          {state === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <div className="w-48 h-32 border-2 border-[#E4B643] rounded-lg opacity-80" />
            </div>
          )}

          {/* Status overlays */}
          {state === 'requesting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <p className="text-white text-sm">{t('books.scanner.requesting', 'Requesting camera…')}</p>
            </div>
          )}

          {state === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 p-4">
              <p className="text-red-400 text-sm text-center">{errorMsg}</p>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-[#28382D] text-white text-sm rounded-xl"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          )}
        </div>

        <p className="p-4 text-center text-xs text-[#8C9C92]">
          {t('books.scanner.hint', 'Point the camera at the barcode on the back of the book.')}
        </p>
      </div>
    </div>
  );
}
