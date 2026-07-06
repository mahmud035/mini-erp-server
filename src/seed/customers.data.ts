/**
 * Demo customers for first-load content. Upserted keyed on `email` (stored
 * lowercase by the Customer schema, so re-runs match and never duplicate).
 * Additive demo data — not tied to auth/roles.
 */
export interface CustomerSeed {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export const customerSeeds: CustomerSeed[] = [
  {
    name: 'Aisha Rahman',
    phone: '01711000001',
    email: 'aisha.rahman@example.com',
    address: 'House 12, Road 8, Dhanmondi, Dhaka',
  },
  {
    name: 'Tanvir Hasan',
    phone: '01711000002',
    email: 'tanvir.hasan@example.com',
    address: 'Plot 45, Gulshan 2, Dhaka',
  },
  {
    name: 'Nusrat Jahan',
    phone: '01711000003',
    email: 'nusrat.jahan@example.com',
    address: 'GEC Circle, Chattogram',
  },
  {
    name: 'Rafiul Islam',
    phone: '01711000004',
    email: 'rafiul.islam@example.com',
    address: 'Zindabazar, Sylhet',
  },
  {
    name: 'Sadia Akter',
    phone: '01711000005',
    email: 'sadia.akter@example.com',
    address: 'Shaheb Bazar, Rajshahi',
  },
];
