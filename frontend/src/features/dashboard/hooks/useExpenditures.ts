import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useExpenditures = (
  params: {
    year?: number;
    lg_code?: string;
    parent_id?: string | null;
  },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['expenditures', params],
    queryFn: () => dashboardService.getExpenditures(params),
    enabled: options?.enabled,
  });
};

export const useOrganizations = (type?: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['organizations', type],
    queryFn: () => dashboardService.getOrganizations(type),
    enabled: options?.enabled,
  });
};

export const useOrganization = (lgCode: string) => {
  return useQuery({
    queryKey: ['organization', lgCode],
    queryFn: () => dashboardService.getOrganizationByCode(lgCode),
    enabled: !!lgCode,
  });
};

export const useYears = () => {
  return useQuery({
    queryKey: ['years'],
    queryFn: () => dashboardService.getYears(),
  });
};
