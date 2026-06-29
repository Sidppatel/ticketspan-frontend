import { useState } from 'react';
import { uploadImage } from '@/shared/upload';
import { rpcErrorMessage } from '@/shared/session';
import { Input } from '@/shared/ui/input';

interface ImageUploadProps {
  entityType: string;
  entityId: string;
  onUploaded: (storageKey: string) => void;
}

export function ImageUpload({ entityType, entityId, onUploaded }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await uploadImage(file, entityType, entityId);
      setStorageKey(result.storageKey);
      onUploaded(result.storageKey);
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Input type="file" accept="image/*" onChange={(e) => handle(e.target.files?.[0])} disabled={uploading} />
      {uploading ? <p className="text-xs text-muted-foreground">Uploading…</p> : null}
      {storageKey ? <p className="text-xs text-success">Uploaded: {storageKey}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
