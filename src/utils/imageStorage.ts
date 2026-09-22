/**
 * Image storage & compression utility for EGX Trading Journal PRO.
 * Compresses images and uploads them to ImgBB for permanent cloud storage.
 * Falls back to Base64 data URLs if the upload fails.
 */

const IMGBB_API_KEY = '58a822fdd6a3b9fc49cb661b77860e2d';

async function uploadToImgBB(base64Image: string): Promise<string> {
  try {
    const base64Data = base64Image.split(',')[1];
    if (!base64Data) return base64Image;

    const formData = new FormData();
    formData.append('image', base64Data);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      console.warn('ImgBB upload failed, falling back to local base64 storage');
      return base64Image;
    }
    
    const data = await response.json();
    return data.data.url;
  } catch (error) {
    console.error("ImgBB upload error:", error);
    return base64Image; // Fallback to base64 if offline or failed
  }
}

export async function processAndCompressImage(file: File | Blob, maxWidth: number = 1600, quality: number = 0.82): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const webpDataUrl = canvas.toDataURL('image/webp', quality);
          if (webpDataUrl.startsWith('data:image/webp')) {
            resolve(webpDataUrl);
            return;
          }
        } catch (_) {}

        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  // Upload compressed base64 to ImgBB and return public URL
  return await uploadToImgBB(base64);
}
