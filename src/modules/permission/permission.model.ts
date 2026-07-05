import { model, Schema } from 'mongoose';
import type { IPermission } from './permission.interface';

const permissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Enforce the `resource:action` shape at the DB boundary.
      match: [/^[a-z]+:[a-z]+$/, 'Permission name must be `resource:action`'],
    },
    resource: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export const Permission = model<IPermission>('Permission', permissionSchema);
