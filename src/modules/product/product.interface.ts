import type { Document } from 'mongoose';

/** A Cloudinary image reference stored on the product. */
export interface ProductImage {
  url: string;
  publicId: string; // canonical Cloudinary public_id — source of truth for image ops
}

/**
 * An inventory item. Prices are stored as-entered; `stockQuantity` is mutated
 * only by the sale flow (Batch 3), never here. `image` is required.
 */
export interface IProduct extends Document {
  name: string;
  sku: string; // unique
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number; // >= 0
  image: ProductImage;
  isActive: boolean;
}
