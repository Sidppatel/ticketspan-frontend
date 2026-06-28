import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { cropToFile, type CropArea } from '@/shared/lib/imageCrop';

interface ImageCropDialogProps {
  file: File;
  aspect: number;
  onCropped: (file: File) => void;
  onCancel: () => void;
}

export function ImageCropDialog({ file, aspect, onCropped, onCancel }: ImageCropDialogProps) {
  const [imageSrc, setImageSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropArea | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setArea(pixels);
  }, []);

  async function confirm() {
    if (!area) {
      return;
    }
    setBusy(true);
    try {
      const cropped = await cropToFile(imageSrc, area, file.name, file.type);
      onCropped(cropped);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onCancel() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Crop image</DialogTitle>
        <div className="relative h-80 w-full overflow-hidden rounded-md bg-stone-900">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : null}
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
          aria-label="Zoom"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={confirm} disabled={busy || !area}>
            {busy ? 'Saving…' : 'Crop & upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
