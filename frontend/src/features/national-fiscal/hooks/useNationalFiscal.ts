import { useQuery } from '@tanstack/react-query';
import { DataType, AccountType } from '@mieruka-tax/shared';
import { nationalFiscalService } from '../services/nationalFiscalService';

export const useNationalExpenditures = (params: {
  year: number;
  lgCode?: string;
  parentId?: string | null;
  dataType?: DataType;
  accountType?: AccountType;
  budgetRevision?: number | null;
}) => {
  return useQuery({
    queryKey: ['national-expenditures', params],
    queryFn: () => nationalFiscalService.getExpenditures(params),
  });
};

export const useFiscalRevenue = (params: {
  year: number;
  lgCode?: string;
  dataType: DataType;
  accountType: AccountType;
  budgetRevision?: number | null;
}) => {
  return useQuery({
    queryKey: ['fiscal-revenue', params],
    queryFn: () => nationalFiscalService.getFiscalRevenue(params),
  });
};

export const useFiscalAvailability = () => {
  return useQuery({
    queryKey: ['fiscal-availability'],
    queryFn: () => nationalFiscalService.getFiscalAvailability(),
  });
};
