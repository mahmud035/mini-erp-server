import { model, Schema } from 'mongoose';
import type { ISale, ISaleItem } from './sale.interface';

// Line-item subdocument: no own _id; unitPrice/lineTotal are price snapshots
// written at sale time, never read live from the Product afterwards.
const saleItemSchema = new Schema<ISaleItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const saleSchema = new Schema<ISale>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: { type: [saleItemSchema], required: true },
    grandTotal: { type: Number, required: true, min: 0 },
    soldBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false },
);

export const Sale = model<ISale>('Sale', saleSchema);
