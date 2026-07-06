import type { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';

export interface UploadedImage {
  url: string;
  publicId: string;
}

interface UploadOptions {
  overwrite?: boolean;
}

/**
 * Uploads an in-memory image buffer to Cloudinary at an EXACT public_id (the
 * full path — no `folder` param, which avoids dynamic-folder ambiguity). On
 * replace pass `{ overwrite: true }`; we also invalidate the CDN cache in that
 * case so the stable URL serves the new bytes. Returns the delivery URL and the
 * canonical public_id (the doc's source of truth for later ops).
 */
export const uploadImage = (
  buffer: Buffer,
  publicId: string,
  { overwrite = false }: UploadOptions = {},
): Promise<UploadedImage> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite,
        invalidate: overwrite,
        resource_type: 'image',
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(error ?? new Error('Cloudinary upload failed'));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
};

/**
 * Best-effort delete of a Cloudinary asset. Cloudinary lives OUTSIDE the Mongo
 * transaction, so a failed or already-missing asset must never break the API:
 * any rejection or non-`ok` result (including `not found`) is logged and
 * swallowed. Never throws.
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result?.result !== 'ok') {
      console.warn(
        `⚠️  Cloudinary destroy for "${publicId}" returned: ${result?.result}`,
      );
    }
  } catch (error) {
    console.warn(`⚠️  Cloudinary destroy for "${publicId}" failed:`, error);
  }
};
