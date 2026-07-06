import { AppError } from '../../utils/AppError';
import { QueryBuilder } from '../../utils/QueryBuilder';
import type { ICustomer } from './customer.interface';
import { Customer } from './customer.model';

interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}
type UpdateCustomerInput = Partial<CreateCustomerInput>;

/**
 * Lists customers with search (name/phone/email), filter, sort, projection, and
 * pagination via the shared QueryBuilder. Returns items + pagination metadata.
 */
const getAll = async (
  query: Record<string, unknown>,
): Promise<{ items: ICustomer[]; pagination: object }> => {
  const qb = new QueryBuilder(Customer.find(), query)
    .search(['name', 'phone', 'email'])
    .filter()
    .sort()
    .fields()
    .paginate();
  const items = await qb.modelQuery;
  const pagination = await qb.countTotal();
  return { items, pagination };
};

/** Returns one customer by id; 404 if absent. */
const getById = async (id: string): Promise<ICustomer> => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new AppError(404, 'Customer not found');
  }
  return customer;
};

/** Creates a customer. */
const create = async (input: CreateCustomerInput): Promise<ICustomer> => {
  return Customer.create(input);
};

/** Updates a customer's provided fields; 404 if absent. */
const update = async (
  id: string,
  input: UpdateCustomerInput,
): Promise<ICustomer> => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new AppError(404, 'Customer not found');
  }
  if (input.name !== undefined) customer.name = input.name;
  if (input.phone !== undefined) customer.phone = input.phone;
  if (input.email !== undefined) customer.email = input.email;
  if (input.address !== undefined) customer.address = input.address;

  await customer.save();
  return customer;
};

/** Deletes a customer by id; 404 if absent. */
const remove = async (id: string): Promise<void> => {
  const deleted = await Customer.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(404, 'Customer not found');
  }
};

export const customerService = { getAll, getById, create, update, remove };
