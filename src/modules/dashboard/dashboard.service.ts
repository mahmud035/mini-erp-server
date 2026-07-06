import { Customer } from '../customer/customer.model';
import { Product } from '../product/product.model';
import { Sale } from '../sale/sale.model';
import type { DashboardStats } from './dashboard.interface';

const LOW_STOCK_THRESHOLD = 5;

/**
 * Computes dashboard aggregates: active product count, customer count, total
 * sales count, and the list of active products below the low-stock threshold
 * (projected to name/sku/stockQuantity). All four run concurrently.
 */
const getStats = async (): Promise<DashboardStats> => {
  const [totalProducts, totalCustomers, totalSales, lowStockProducts] =
    await Promise.all([
      Product.countDocuments({ isActive: true }),
      Customer.countDocuments(),
      Sale.countDocuments(),
      Product.find({
        isActive: true,
        stockQuantity: { $lt: LOW_STOCK_THRESHOLD },
      }).select('name sku stockQuantity'),
    ]);

  return { totalProducts, totalCustomers, totalSales, lowStockProducts };
};

export const dashboardService = { getStats };
