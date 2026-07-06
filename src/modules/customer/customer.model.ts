import { model, Schema } from 'mongoose';
import type { ICustomer } from './customer.interface';

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export const Customer = model<ICustomer>('Customer', customerSchema);
