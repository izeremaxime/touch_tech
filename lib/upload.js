import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'assets', 'uploads');

/** Validates and saves an uploaded product image File. Returns the public path, e.g. "/assets/uploads/xxx.png". */
export async function saveUploadedImage(file) {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Image file is too large. Max size is 2MB.');
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.');
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const fileName = crypto.randomBytes(8).toString('hex') + '.' + ext;
  const destPath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(destPath, buffer);

  return '/assets/uploads/' + fileName;
}

/** Deletes a previously uploaded image (safe no-op for non-upload paths like seeded /assets/images/*). */
export async function deleteUploadedImage(imagePath) {
  if (!imagePath || !imagePath.startsWith('/assets/uploads/')) return;
  const filePath = path.join(process.cwd(), 'public', imagePath);
  try {
    await unlink(filePath);
  } catch {
    // File may already be gone — ignore.
  }
}
