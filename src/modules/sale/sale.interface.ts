import type { Document, Types } from 'mongoose';

/**
 * A single line in a sale. `unitPrice` is a SNAPSHOT of the product's selling
 * price at sale time — past sales must never shift when the product price later
 * changes. `lineTotal` = unitPrice * quantity. This subdocument has no own `_id`.
 */
export interface ISaleItem {
  product: Types.ObjectId; // ref Product
  quantity: number; // integer > 0
  unitPrice: number; // snapshot of Product.sellingPrice at sale time
  lineTotal: number; // unitPrice * quantity (server-computed)
}

/**
 * A completed, immutable sale. Created transactionally (guarded atomic stock
 * decrement per line item); never updated or deleted. `grandTotal` is always
 * server-computed (Σ lineTotal); `soldBy` is the authenticated user.
 */
export interface ISale extends Document {
  customer: Types.ObjectId; // ref Customer
  items: ISaleItem[];
  grandTotal: number;
  soldBy: Types.ObjectId; // ref User
}
