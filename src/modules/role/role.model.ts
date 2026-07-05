import { model, Schema } from 'mongoose';
import type { IRole } from './role.interface';

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
        required: true,
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

export const Role = model<IRole>('Role', roleSchema);
