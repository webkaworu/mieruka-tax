import { useQuery } from '@tanstack/react-query';
import { simulatorService } from '../services/simulatorService';

export const useConversionUnits = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['conversion-units'],
    queryFn: () => simulatorService.getConversionUnits(),
    enabled: options?.enabled,
  });
};
