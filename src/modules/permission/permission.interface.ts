import type { Document } from 'mongoose';

/**
 * A single, atomic authorization grant expressed as `resource:action`
 * (e.g. `product:create`). The seeded Permission catalog is the source of
 * truth; Roles reference these documents.
 */
export interface IPermission extends Document {
  name: string; // unique, format: `resource:action`
  resource: string; // e.g. `product`
  action: string; // e.g. `create`
  description?: string;
}
