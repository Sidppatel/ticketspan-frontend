export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function parseAspect(ratio: string): number {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) {
    return 1;
  }
  return w / h;
}

export function aspectCss(ratio: string): string {
  return ratio.replace(':', ' / ');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function cropToFile(
  imageSrc: string,
  area: CropArea,
  fileName: string,
  mimeType: string,
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not supported');
  }
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const type = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92));
  if (!blob) {
    throw new Error('Failed to crop image');
  }
  return new File([blob], fileName, { type });
}
