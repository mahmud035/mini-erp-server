import type { Query, QueryFilter } from 'mongoose';

/**
 * Reusable, chainable wrapper around a Mongoose Query that applies the common
 * list-endpoint concerns — search, filter, sort, field projection, and
 * pagination — from a raw request query object. Generic over the document type
 * so every feature reuses one implementation.
 *
 * Usage:
 *   const qb = new QueryBuilder(Product.find(), req.query)
 *     .search(['name', 'sku'])
 *     .filter()
 *     .sort()
 *     .fields()
 *     .paginate();
 *   const data = await qb.modelQuery;
 *   const meta = await qb.countTotal();
 */
export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  private readonly query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  /** Case-insensitive OR-match of `searchTerm` across the given fields. */
  search(searchableFields: string[]): this {
    const searchTerm = this.query.searchTerm;
    if (typeof searchTerm === 'string' && searchTerm.length > 0) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: searchTerm, $options: 'i' },
            }) as QueryFilter<T>,
        ),
      } as QueryFilter<T>);
    }
    return this;
  }

  /** Equality filter on every query key except the reserved control keys. */
  filter(): this {
    const queryObj = { ...this.query };
    const excluded = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
    excluded.forEach((key) => delete queryObj[key]);
    this.modelQuery = this.modelQuery.find(queryObj as QueryFilter<T>);
    return this;
  }

  /** Applies `?sort=field,-field`; defaults to newest first. */
  sort(): this {
    const sort =
      (this.query.sort as string | undefined)?.split(',').join(' ') ??
      '-createdAt';
    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }

  /** Applies `?page` / `?limit` (defaults page 1, limit 10). */
  paginate(): this {
    const page = Math.max(Number(this.query.page) || 1, 1);
    const limit = Math.max(Number(this.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  /** Applies `?fields=a,b`; defaults to excluding the __v key. */
  fields(): this {
    const fields =
      (this.query.fields as string | undefined)?.split(',').join(' ') ?? '-__v';
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  /** Returns pagination metadata for the current filter (ignores paging). */
  async countTotal(): Promise<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const filter = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(filter);
    const page = Math.max(Number(this.query.page) || 1, 1);
    const limit = Math.max(Number(this.query.limit) || 10, 1);
    return { page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}
