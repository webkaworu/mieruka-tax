import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/features/dashboard';

// 複数組織の支出データを並行取得するフック
export const useComparisonData = (lgCodes: string[], year: number) => {
    return useQuery({
        queryKey: ['comparison', lgCodes, year],
        queryFn: async () => {
            // 各組織の支出データを並行取得
            const results = await Promise.all(
                lgCodes.map(async (lgCode) => {
                    const [expenditures, org] = await Promise.all([
                        dashboardService.getExpenditures({ year, lg_code: lgCode }),
                        lgCode ? dashboardService.getOrganizationByCode(lgCode) : Promise.resolve(null),
                    ]);
                    return { lgCode, org, expenditures };
                })
            );
            return results;
        },
        enabled: lgCodes.length >= 2,
    });
};
