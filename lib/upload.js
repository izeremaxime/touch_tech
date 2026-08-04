import { put, del } from '@vercel/blob';
import crypto from 'crypto';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

/** Validates and uploads a product image File to Vercel Blob. Returns its public URL. */
export async function saveUploadedImage(file) {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Image file is too large. Max size is 2MB.');
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.');
  }

  const fileName = crypto.randomBytes(8).toString('hex') + '.' + ext;
  const blob = await put(fileName, file, { access: 'public', contentType: file.type });

  return blob.url;
}

/** Deletes a previously uploaded Blob image (safe no-op for seeded local paths like /assets/images/*). */
export async function deleteUploadedImage(imagePath) {
  if (!imagePath || !imagePath.includes('.blob.vercel-storage.com')) return;
  try {
    await del(imagePath);
  } catch {
    // Blob may already be gone — ignore.
  }
}
