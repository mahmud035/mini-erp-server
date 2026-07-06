/**
 * Demo products for first-load content. Upserted keyed on `sku` (defined
 * UPPERCASE to match the Product schema's `uppercase: true`, so re-runs match
 * and never duplicate). Images are PLACEHOLDERS — no Cloudinary upload. One
 * product is intentionally below the low-stock threshold (< 5) so the dashboard
 * low-stock card has content on first load.
 */
export interface ProductSeed {
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  image: { url: string; publicId: string };
}

export const productSeeds: ProductSeed[] = [
  {
    name: 'Ergonomic Office Chair',
    sku: 'ERG-CHAIR-01',
    category: 'Furniture',
    purchasePrice: 6500,
    sellingPrice: 9500,
    stockQuantity: 12,
    image: {
      url: 'https://placehold.co/600x400?text=Ergonomic+Office+Chair',
      publicId: 'seed/placeholder-1',
    },
  },
  {
    name: 'Wireless Mouse',
    sku: 'WL-MOUSE-02',
    category: 'Electronics',
    purchasePrice: 700,
    sellingPrice: 1200,
    stockQuantity: 3, // below the low-stock threshold (< 5) on purpose
    image: {
      url: 'https://placehold.co/600x400?text=Wireless+Mouse',
      publicId: 'seed/placeholder-2',
    },
  },
  {
    name: 'Standing Desk',
    sku: 'STAND-DESK-03',
    category: 'Furniture',
    purchasePrice: 18000,
    sellingPrice: 24500,
    stockQuantity: 8,
    image: {
      url: 'https://placehold.co/600x400?text=Standing+Desk',
      publicId: 'seed/placeholder-3',
    },
  },
];
