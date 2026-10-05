/**
 * Image storage & compression utility for EGX Trading Journal PRO.
 * Highly optimized WebP compression with multi-provider cloud upload & local IndexedDB fallback.
 * Prevents Firestore document bloat.
 */

// Simple IndexedDB image store for offline charts
const DB_NAME = 'EGX_Image_Cache_DB';
const STORE_NAME = 'chart_images';

function openImageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveImageToLocalCache(id: string, dataUrl: string): Promise<string> {
  try {
    const db = await openImageDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, dataUrl, createdAt: Date.now() });
    return `local-img://${id}`;
  } catch (e) {
    console.warn('Failed to save image to IndexedDB:', e);
    return dataUrl;
  }
}

export async function getImageFromLocalCache(idOrUrl: string): Promise<string> {
  if (!idOrUrl.startsWith('local-img://')) return idOrUrl;
  const id = idOrUrl.replace('local-img://', '');
  try {
    const db = await openImageDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result?.dataUrl) resolve(req.result.dataUrl);
        else resolve('');
      };
      req.onerror = () => resolve('');
    });
  } catch {
    return '';
  }
}

const DEFAULT_IMGBB_KEY = '58a822fdd6a3b9fc49cb661b77860e2d';

async function uploadToCloudflareOrCustom(dataUrl: string, endpoint: string, customApiKey?: string): Promise<string> {
  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) return dataUrl;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(customApiKey ? { 'Authorization': `Bearer ${customApiKey}` } : {})
    },
    body: JSON.stringify({ image: base64Data })
  });

  if (!res.ok) throw new Error(`Custom image upload failed: ${res.statusText}`);
  const json = await res.json();
  return json.url || json.result?.url || json.data?.url;
}

async function uploadToImgBB(base64Image: string, apiKey: string = DEFAULT_IMGBB_KEY): Promise<string> {
  const base64Data = base64Image.split(',')[1];
  if (!base64Data) return base64Image;

  const formData = new FormData();
  formData.append('image', base64Data);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('ImgBB upload returned status ' + response.status);
  }
  
  const data = await response.json();
  return data.data.url;
}

export async function processAndCompressImage(
  file: File | Blob, 
  maxWidth: number = 1400, 
  quality: number = 0.80
): Promise<string> {
  const compressedDataUrl = await new Promise<string>((resolve, reject) => {
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

  // Check user settings for cloud upload
  const customProvider = localStorage.getItem('egx_image_provider'); // 'imgbb' | 'cloudflare' | 'local'
  const customKey = localStorage.getItem('egx_image_key');
  const customEndpoint = localStorage.getItem('egx_image_endpoint');

  if (customProvider === 'local') {
    const localId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    return await saveImageToLocalCache(localId, compressedDataUrl);
  }

  try {
    if (customProvider === 'cloudflare' && customEndpoint) {
      return await uploadToCloudflareOrCustom(compressedDataUrl, customEndpoint, customKey || undefined);
    }
    // Default to ImgBB
    return await uploadToImgBB(compressedDataUrl, customKey || DEFAULT_IMGBB_KEY);
  } catch (cloudErr) {
    console.warn('Cloud upload failed, falling back to local IndexedDB storage to preserve database health:', cloudErr);
    const localId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    return await saveImageToLocalCache(localId, compressedDataUrl);
  }
}

