import mongoose from 'mongoose';
import type { PopulateOptions } from 'mongoose';
import { emitLowStock } from '../../socket';
import { AppError } from '../../utils/AppError';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { Customer } from '../customer/customer.model';
import type { IProduct } from '../product/product.interface';
import { Product } from '../product/product.model';
import type { ISale, ISaleItem } from './sale.interface';
import { Sale } from './sale.model';

// Products at or below this on-hand quantity trigger a low-stock alert.
const LOW_STOCK_THRESHOLD = 5;

interface SaleItemInput {
  product: string;
  quantity: number;
}
interface CreateSaleInput {
  customer: string;
  items: SaleItemInput[];
}

// Read-time enrichment: customer name + each line's product name/sku. Never
// re-derives price from the Product — unitPrice is the stored snapshot.
const POPULATE: PopulateOptions[] = [
  { path: 'customer', select: 'name' },
  { path: 'items.product', select: 'name sku' },
];

/**
 * Records a sale ATOMICALLY. Verifies the customer exists, then inside a single
 * Mongoose transaction performs a GUARDED atomic decrement per line item
 * (findOneAndUpdate on { _id, isActive, stockQuantity >= qty } with $inc). If
 * any line's guard fails, the update returns null → we throw → the WHOLE
 * transaction aborts, so no stock is changed and no sale is written (no partial
 * sale). unitPrice is snapshotted from the product and grandTotal is summed
 * server-side; neither is ever trusted from the client. Returns the created
 * sale, populated.
 */
const create = async (
  input: CreateSaleInput,
  userId: string,
): Promise<ISale> => {
  const customer = await Customer.findById(input.customer);
  if (!customer) {
    throw new AppError(404, 'Customer not found');
  }

  const session = await mongoose.startSession();
  let created: ISale | null = null;
  // Post-decrement product docs, held for the after-commit low-stock check.
  // Reset at the top of the callback so a withTransaction retry starts fresh.
  let updatedProducts: IProduct[] = [];
  try {
    await session.withTransaction(async () => {
      const computedItems: ISaleItem[] = [];
      updatedProducts = [];

      for (const item of input.items) {
        const product = await Product.findOneAndUpdate(
          {
            _id: item.product,
            isActive: true,
            stockQuantity: { $gte: item.quantity },
          },
          { $inc: { stockQuantity: -item.quantity } },
          { returnDocument: 'after', session },
        );
        if (!product) {
          throw new AppError(
            409,
            `Insufficient stock or unavailable product: ${item.product}`,
          );
        }

        const unitPrice = product.sellingPrice; // snapshot — server-owned
        computedItems.push({
          product: new mongoose.Types.ObjectId(item.product),
          quantity: item.quantity,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
        });
        updatedProducts.push(product);
      }

      const grandTotal = computedItems.reduce(
        (sum, i) => sum + i.lineTotal,
        0,
      );
      const [doc] = await Sale.create(
        [
          {
            customer: new mongoose.Types.ObjectId(input.customer),
            items: computedItems,
            grandTotal,
            soldBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session }, // array form is required when passing a session
      );
      created = doc;
    });
  } finally {
    await session.endSession();
  }

  if (!created) {
    throw new AppError(500, 'Sale creation failed');
  }

  const sale = await Sale.findById((created as ISale)._id).populate(POPULATE);
  if (!sale) {
    throw new AppError(500, 'Sale not found after creation');
  }

  // After commit only: alert on any product this sale dropped below threshold.
  // Best-effort — emitLowStock swallows all socket errors, never delaying the
  // sale. Skipped entirely when nothing crossed the line.
  const lowStock = updatedProducts
    .filter((p) => p.stockQuantity < LOW_STOCK_THRESHOLD)
    .map((p) => ({
      id: String(p._id),
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stockQuantity,
    }));
  if (lowStock.length > 0) {
    emitLowStock(lowStock, String(sale._id));
  }

  return sale;
};

/**
 * Lists sales (newest first) with filter, sort, projection, and pagination via
 * the shared QueryBuilder; populates customer name and each line's product
 * name/sku. Returns items + pagination metadata.
 */
const getAll = async (
  query: Record<string, unknown>,
): Promise<{ items: ISale[]; pagination: object }> => {
  const qb = new QueryBuilder(Sale.find(), query)
    .filter()
    .sort()
    .fields()
    .paginate();
  const items = await qb.modelQuery.populate(POPULATE);
  const pagination = await qb.countTotal();
  return { items, pagination };
};

/** Returns one sale by id, populated; 404 if absent. */
const getById = async (id: string): Promise<ISale> => {
  const sale = await Sale.findById(id).populate(POPULATE);
  if (!sale) {
    throw new AppError(404, 'Sale not found');
  }
  return sale;
};

export const saleService = { create, getAll, getById };
