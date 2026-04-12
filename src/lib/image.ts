/** Resize and compress a picked image for localStorage (data URL). */
export function fileToAvatarDataUrl(file: File, maxEdge = 320, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const {width, height} = img;
          const scale = Math.min(1, maxEdge / Math.max(width, height));
          const w = Math.max(1, Math.round(width * scale));
          const h = Math.max(1, Math.round(height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas unsupported'));
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const url = canvas.toDataURL('image/jpeg', quality);
          resolve(url);
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Image processing failed'));
        }
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
