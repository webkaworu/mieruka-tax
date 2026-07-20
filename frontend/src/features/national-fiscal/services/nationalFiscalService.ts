import { client } from '../../../api/client';
import { DataType, AccountType, ExpenditureSummary, FiscalAvailability } from '@mieruka-tax/shared';

export const nationalFiscalService = {
  // 歳出データの取得
  async getExpenditures(params: {
    year: number;
    lgCode?: string;
    parentId?: string | null;
    dataType?: DataType;
    accountType?: AccountType;
    budgetRevision?: number | null;
  }): Promise<ExpenditureSummary[]> {
    const query: Record<string, string> = {
      year: params.year.toString(),
      lg_code: params.lgCode || '000000',
    };

    if (params.parentId) query.parent_id = params.parentId;
    if (params.dataType) query.data_type = params.dataType;
    if (params.accountType) query.account_type = params.accountType;
    if (params.budgetRevision !== undefined && params.budgetRevision !== null) {
      query.budget_revision = params.budgetRevision.toString();
    }

    const res = await client.expenditures.$get({ query });
    if (!res.ok) throw new Error('Failed to fetch expenditures');
    return res.json();
  },

  // 歳入合計の取得
  async getFiscalRevenue(params: {
    year: number;
    lgCode?: string;
    dataType: DataType;
    accountType: AccountType;
    budgetRevision?: number | null;
  }): Promise<number> {
    const query: Record<string, string> = {
      year: params.year.toString(),
      lg_code: params.lgCode || '000000',
      data_type: params.dataType,
      account_type: params.accountType,
    };

    if (params.budgetRevision !== undefined && params.budgetRevision !== null) {
      query.budget_revision = params.budgetRevision.toString();
    }

    const res = await client['fiscal-revenue'].$get({ query });
    if (!res.ok) throw new Error('Failed to fetch fiscal revenue');
    const data = await res.json();
    return data.revenue;
  },

  // 決算公開状況の取得
  async getFiscalAvailability(year?: number): Promise<FiscalAvailability[]> {
    const query: Record<string, string> = {};
    if (year) query.year = year.toString();

    const res = await client['fiscal-availability'].$get({ query });
    if (!res.ok) throw new Error('Failed to fetch fiscal availability');
    return res.json();
  }
};
