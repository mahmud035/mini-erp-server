import type { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { Customer } from '../modules/customer/customer.model';
import { Permission } from '../modules/permission/permission.model';
import { Product } from '../modules/product/product.model';
import { Role } from '../modules/role/role.model';
import { User } from '../modules/user/user.model';
import { customerSeeds } from './customers.data';
import { permissionCatalog } from './permissions.data';
import { productSeeds } from './products.data';
import { roleSeeds } from './roles.data';
import { DEV_PASSWORD, userSeeds } from './users.data';

/**
 * Upserts the full permission catalog and returns a name -> _id lookup used to
 * resolve role assignments. Idempotent: re-running updates existing docs in
 * place rather than duplicating them.
 */
const seedPermissions = async (): Promise<Map<string, Types.ObjectId>> => {
  const lookup = new Map<string, Types.ObjectId>();
  for (const p of permissionCatalog) {
    const doc = await Permission.findOneAndUpdate(
      { name: p.name },
      { $set: p },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    lookup.set(p.name, doc._id as Types.ObjectId);
  }
  console.log(`  • permissions: ${lookup.size} upserted`);
  return lookup;
};

/**
 * Upserts the three system roles, resolving each role's permission names to
 * ObjectIds via the catalog lookup. Idempotent per role name.
 */
const seedRoles = async (
  permissionIds: Map<string, Types.ObjectId>,
): Promise<void> => {
  for (const role of roleSeeds) {
    const ids = role.permissions.map((name) => {
      const id = permissionIds.get(name);
      if (!id) throw new Error(`Unknown permission in seed: ${name}`);
      return id;
    });
    await Role.findOneAndUpdate(
      { name: role.name },
      { $set: { permissions: ids, isSystem: role.isSystem } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    console.log(`  • role ${role.name}: ${ids.length} permissions`);
  }
};

/**
 * Creates one dev user per role if absent, resolving roleName -> Role _id.
 * Existing users are left in place (only role/isActive are reconciled) so
 * passwords are not re-hashed and no duplicates are created on re-run.
 */
const seedUsers = async (): Promise<void> => {
  for (const seed of userSeeds) {
    const role = await Role.findOne({ name: seed.roleName });
    if (!role) throw new Error(`Unknown role in seed: ${seed.roleName}`);

    const existing = await User.findOne({ email: seed.email });
    if (existing) {
      existing.role = role._id as Types.ObjectId;
      existing.isActive = true;
      await existing.save(); // password unchanged -> pre-save skips re-hash
      console.log(`  • user ${seed.email}: reconciled`);
    } else {
      await User.create({
        name: seed.name,
        email: seed.email,
        password: seed.password, // hashed by the pre-save hook
        role: role._id,
        isActive: true,
      });
      console.log(`  • user ${seed.email}: created`);
    }
  }
};

/**
 * Upserts the demo customers keyed on email. Idempotent: re-running updates the
 * matched doc in place rather than inserting a duplicate. Additive demo data.
 */
const seedCustomers = async (): Promise<void> => {
  for (const c of customerSeeds) {
    await Customer.findOneAndUpdate(
      { email: c.email },
      { $set: c },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }
  console.log(`  • customers: ${customerSeeds.length} upserted`);
};

/**
 * Upserts the demo products keyed on sku (placeholder images, no Cloudinary).
 * Idempotent per sku. One product is intentionally low-stock for the dashboard.
 */
const seedProducts = async (): Promise<void> => {
  for (const p of productSeeds) {
    await Product.findOneAndUpdate(
      { sku: p.sku },
      { $set: p },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }
  console.log(`  • products: ${productSeeds.length} upserted`);
};

/**
 * Idempotent seed entry point: permissions -> roles -> users -> demo customers
 * & products, then prints the dev credentials. Safe to run repeatedly.
 */
const seed = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('🌱 Seeding...');

    const permissionIds = await seedPermissions();
    await seedRoles(permissionIds);
    await seedUsers();
    await seedCustomers();
    await seedProducts();

    console.log('\n✅ Seed complete. Dev credentials (password for all):');
    console.log(`   password: ${DEV_PASSWORD}`);
    for (const u of userSeeds) {
      console.log(`   ${u.roleName.padEnd(9)} → ${u.email}`);
    }

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

void seed();
