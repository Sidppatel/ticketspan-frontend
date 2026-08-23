import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, Flashlight, FlipHorizontal, CircleAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';

interface CameraQrScannerProps {
  onScan: (decodedText: string) => void;
  isPaused?: boolean;
  className?: string;
}

export function CameraQrScanner({ onScan, isPaused = false, className }: CameraQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stopStream = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      void e;
    }
  }, []);

  const startScanning = useCallback(async () => {
    stopStream();
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Camera access is not supported on this browser or connection.');
        setHasPermission(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
      setHasPermission(true);

      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() as { torch?: boolean }) || {};
        setHasTorch(Boolean(capabilities.torch));
      }
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setErrorMsg('Camera permission was denied. Please allow camera access in browser settings.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setErrorMsg('No camera found on this device.');
      } else {
        setErrorMsg('Unable to start camera. Please verify device permissions.');
      }
      setHasPermission(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void startScanning();
    }, 0);
    return () => {
      clearTimeout(timer);
      stopStream();
    };
  }, [startScanning, stopStream]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      void e;
    }
  }, [torchOn]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setTorchOn(false);
  }, []);

  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;

      if (!isPaused && videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            const now = Date.now();
            if (now - lastScannedTimeRef.current > 1800) {
              lastScannedTimeRef.current = now;
              playBeep();
              onScan(code.data);
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPaused, onScan, playBeep]);

  return (
    <div className={cn('relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl border border-border/40', className)}>
      <video
        ref={videoRef}
        className="w-full h-72 sm:h-96 object-cover"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {hasPermission && !isPaused && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative size-60 sm:size-68 rounded-2xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
            <div className="absolute top-0 left-0 size-5 border-t-4 border-l-4 border-primary -mt-1 -ml-1 rounded-tl" />
            <div className="absolute top-0 right-0 size-5 border-t-4 border-r-4 border-primary -mt-1 -mr-1 rounded-tr" />
            <div className="absolute bottom-0 left-0 size-5 border-b-4 border-l-4 border-primary -mb-1 -ml-1 rounded-bl" />
            <div className="absolute bottom-0 right-0 size-5 border-b-4 border-r-4 border-primary -mb-1 -mr-1 rounded-br" />
            <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-laser shadow-[0_0_12px_var(--primary)]" />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="absolute inset-0 bg-background/95 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <CircleAlert className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Camera Unavailable</p>
            <p className="text-xs text-muted-foreground max-w-xs">{errorMsg}</p>
          </div>
          <Button size="sm" onClick={() => void startScanning()} className="ticketspan-spring-btn gap-2 text-xs font-bold">
            <RefreshCw className="size-3.5" /> Try Again
          </Button>
        </div>
      )}

      {hasPermission && (
        <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] font-bold text-white tracking-wide">
            <Camera className="size-3.5 text-primary" /> Live Scanner
          </div>

          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={cn(
                  'size-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer shadow-lg',
                  torchOn ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/60 text-white border-white/20 hover:bg-black/80',
                )}
                title="Toggle Torch / Flashlight"
              >
                <Flashlight className="size-4" />
              </button>
            )}

            <button
              type="button"
              onClick={toggleCamera}
              className="size-10 rounded-full flex items-center justify-center bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 transition-all cursor-pointer shadow-lg"
              title="Flip Camera"
            >
              <FlipHorizontal className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
