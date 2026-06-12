import { client } from '@/api/client';

export const simulatorService = {
  getConversionUnits: async () => {
    const res = await client['conversion-units'].$get();
    if (!res.ok) {
      throw new Error('Failed to fetch conversion units');
    }
    return await res.json();
  },
};
