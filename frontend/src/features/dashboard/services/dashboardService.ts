import { client } from '@/api/client';

export const dashboardService = {
  getExpenditures: async (params: {
    year?: number;
    lg_code?: string;
    parent_id?: string | null;
  }) => {
    const res = await client.expenditures.$get({
      query: {
        year: params.year?.toString(),
        lg_code: params.lg_code,
        parent_id: params.parent_id ?? undefined,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch expenditures');
    return await res.json();
  },

  getOrganizations: async (type?: string) => {
    const res = await client.organizations.$get({
      query: { type },
    });
    if (!res.ok) throw new Error('Failed to fetch organizations');
    return await res.json();
  },

  getOrganizationByCode: async (lgCode: string) => {
    const res = await client.organizations[':lgCode'].$get({
      param: { lgCode },
    });
    if (!res.ok) throw new Error('Failed to fetch organization');
    return await res.json();
  },

  getYears: async () => {
    const res = await client.years.$get();
    if (!res.ok) throw new Error('Failed to fetch years');
    return await res.json();
  }
};
