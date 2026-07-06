import type { Document } from 'mongoose';

/**
 * A sales customer. `name` and `phone` are required; `email` and `address` are
 * optional contact details. Referenced by sales in Batch 3.
 */
export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}
