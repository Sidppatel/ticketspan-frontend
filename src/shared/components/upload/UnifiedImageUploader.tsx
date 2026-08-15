import { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Trash2, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { ImageCropDialog } from '@/shared/components/ImageCropDialog';
import { uploadImage, imageUrl } from '@/shared/upload';
import { rpcErrorMessage } from '@/shared/session';
import { parseAspect, aspectCss } from '@/shared/lib/imageCrop';
import { cn } from '@/shared/lib/cn';

interface UnifiedImageUploaderProps {
  entityType: string;
  entityId?: string;
  imagesId: string;
  onChange: (imagesId: string) => void;
  aspectRatio?: string;
  label?: string;
  hint?: string;
  className?: string;
  enableCrop?: boolean;
}

export function UnifiedImageUploader({
  entityType,
  entityId = '',
  imagesId,
  onChange,
  aspectRatio = '1:1',
  label = 'Entity Image / Logo',
  hint = 'Supports PNG, JPG, WEBP up to 10MB',
  className,
  enableCrop = true,
}: UnifiedImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);

  const numericAspect = parseAspect(aspectRatio);
  const cssAspect = aspectCss(aspectRatio);

  function handleFileSelected(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (enableCrop) {
      setPendingCropFile(file);
    } else {
      executeUpload(file);
    }
  }

  async function executeUpload(file: File) {
    setBusy(true);
    setProgress(20);
    setError(null);
    try {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 15));
      }, 120);

      const result = await uploadImage(file, entityType, entityId);
      clearInterval(interval);
      setProgress(100);
      onChange(result.imagesId);
      toast.success('Image uploaded successfully');
    } catch (caught) {
      setError(rpcErrorMessage(caught));
      toast.error(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 400);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelected(file);
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <ImageIcon className="size-3.5 text-primary" /> {label}
        </label>
        <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase bg-muted/60 px-2 py-0.5 rounded-full border border-border/40">
          Ratio {aspectRatio}
        </span>
      </div>

      {imagesId ? (
        <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-2 shadow-sm transition-all duration-300 hover:border-primary/50">
          <div className={cn('relative w-full overflow-hidden rounded-xl bg-black/5', cssAspect)}>
            <img
              src={imageUrl(imagesId)}
              alt="Uploaded Preview"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-white/80 truncate">UUID: {imagesId.slice(0, 8)}...</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={busy}
                    className="h-7 px-2.5 text-[11px] font-bold bg-white/20 text-white backdrop-blur-md hover:bg-white/30 border border-white/30"
                  >
                    <RefreshCw className="size-3 mr-1" /> Replace
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onChange('')}
                    disabled={busy}
                    className="h-7 px-2.5 text-[11px] font-bold"
                  >
                    <Trash2 className="size-3 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="size-3" /> Ready
            </span>
            <span className="text-[10px] text-muted-foreground">{hint}</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300',
            dragOver
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-muted/40',
            busy && 'pointer-events-none opacity-60',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />

          <div className="relative mb-3 flex size-12 items-center justify-center rounded-2xl bg-background shadow-md border border-border/40 group-hover:scale-110 transition-transform duration-300">
            {busy ? (
              <RefreshCw className="size-6 animate-spin text-primary" />
            ) : (
              <Upload className="size-6 text-primary group-hover:text-primary/80" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1">
              <span>Drop image here or</span> <span className="text-primary underline font-extrabold">click to browse</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">{hint}</p>
          </div>

          {progress > 0 && (
            <div className="mt-3 w-full max-w-xs space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-mono text-[9px] text-muted-foreground">{progress}% uploaded</span>
            </div>
          )}
        </div>
      )}

      {error ? (
        <p className="text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2 animate-shake">
          {error}
        </p>
      ) : null}

      {pendingCropFile && (
        <ImageCropDialog
          file={pendingCropFile}
          aspect={numericAspect}
          onCancel={() => setPendingCropFile(null)}
          onCropped={(croppedFile: File) => {
            setPendingCropFile(null);
            executeUpload(croppedFile);
          }}
        />
      )}
    </div>
  );
}
