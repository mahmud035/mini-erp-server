import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { deleteImage, uploadImage } from '../../utils/cloudinary';
import { QueryBuilder } from '../../utils/QueryBuilder';
import type { IProduct } from './product.interface';
import { Product } from './product.model';

interface CreateProductInput {
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
}
type UpdateProductInput = Partial<CreateProductInput & { isActive: boolean }>;

const IMAGE_FOLDER = 'personal/mini-erp/products';

/**
 * Lists products with search (name/sku/category), filter, sort, field
 * projection, and pagination via the shared QueryBuilder. Returns the page of
 * items plus pagination metadata.
 */
const getAll = async (
  query: Record<string, unknown>,
): Promise<{ items: IProduct[]; pagination: object }> => {
  const qb = new QueryBuilder(Product.find(), query)
    .search(['name', 'sku', 'category'])
    .filter()
    .sort()
    .fields()
    .paginate();
  const items = await qb.modelQuery;
  const pagination = await qb.countTotal();
  return { items, pagination };
};

/** Returns one product by id; 404 if absent. */
const getById = async (id: string): Promise<IProduct> => {
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }
  return product;
};

/**
 * Creates a product with a required image. The _id is generated up front so the
 * image's public_id (`{IMAGE_FOLDER}/{id}`) is known before upload. If the DB
 * insert fails (e.g. duplicate SKU) after the image is uploaded, the orphaned
 * asset is cleaned up best-effort before the error propagates.
 */
const create = async (
  input: CreateProductInput,
  buffer: Buffer,
): Promise<IProduct> => {
  const _id = new Types.ObjectId();
  const publicId = `${IMAGE_FOLDER}/${_id.toString()}`;
  const image = await uploadImage(buffer, publicId, { overwrite: false });

  try {
    return await Product.create({ _id, ...input, image });
  } catch (error) {
    await deleteImage(image.publicId); // compensate: no orphan on failed insert
    throw error;
  }
};

/**
 * Updates a product. A new image (optional) is uploaded to the SAME public_id
 * (read from the doc — the source of truth) with overwrite+invalidate, so the
 * URL stays stable and the CDN cache is purged; there is no delete-old step.
 */
const update = async (
  id: string,
  input: UpdateProductInput,
  buffer?: Buffer,
): Promise<IProduct> => {
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  if (buffer) {
    product.image = await uploadImage(buffer, product.image.publicId, {
      overwrite: true,
    });
  }

  if (input.name !== undefined) product.name = input.name;
  if (input.sku !== undefined) product.sku = input.sku;
  if (input.category !== undefined) product.category = input.category;
  if (input.purchasePrice !== undefined)
    product.purchasePrice = input.purchasePrice;
  if (input.sellingPrice !== undefined)
    product.sellingPrice = input.sellingPrice;
  if (input.stockQuantity !== undefined)
    product.stockQuantity = input.stockQuantity;
  if (input.isActive !== undefined) product.isActive = input.isActive;

  await product.save();
  return product;
};

/**
 * Deletes a product: removes the DB doc FIRST, then destroys the Cloudinary
 * asset best-effort (outside any transaction — never blocks on media failure).
 */
const remove = async (id: string): Promise<void> => {
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(404, 'Product not found');
  }
  await deleteImage(deleted.image.publicId);
};

export const productService = { getAll, getById, create, update, remove };
