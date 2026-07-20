import { NationalFiscalDashboard } from '../features/national-fiscal';

export const DashboardPage = () => {
    return (
        <div className="w-full px-8 py-6 animate-in fade-in duration-500">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                        国家財政データ可視化
                    </h1>
                    <p className="text-slate-500 text-xs mt-1">
                        財務省の公開データ（一般会計・特別会計・政府関係機関）をもとに、予算と決算の使途割合や推移を可視化します。
                    </p>
                </div>
            </div>
            
            <NationalFiscalDashboard />
        </div>
    );
};

