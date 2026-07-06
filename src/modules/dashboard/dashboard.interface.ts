/** A low-stock product summary surfaced on the dashboard. */
export interface LowStockProduct {
  name: string;
  sku: string;
  stockQuantity: number;
}

/** Aggregate counts + low-stock list for the dashboard landing view. */
export interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalSales: number;
  lowStockProducts: LowStockProduct[];
}
