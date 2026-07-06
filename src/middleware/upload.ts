import multer from 'multer';
import { AppError } from '../utils/AppError';

/**
 * Multer instance using in-memory storage so the uploaded file is available as
 * `req.file.buffer` and can be streamed straight to Cloudinary (no temp files
 * on disk). Rejects non-image uploads and caps size at 5 MB. Routes consume it
 * via `upload.single('image')`. Size/count violations surface as MulterError,
 * which the global error handler maps to 400.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only image files are allowed'));
    }
  },
});
