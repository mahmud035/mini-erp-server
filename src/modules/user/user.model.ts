import bcrypt from 'bcrypt';
import { model, Schema } from 'mongoose';
import { config } from '../../config';
import type { IUser } from './user.interface';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false },
);

// Hash the password before persisting, only when it actually changed, so
// updates that leave the password untouched don't re-hash an existing hash.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, config.bcryptSaltRounds);
});

export const User = model<IUser>('User', userSchema);
