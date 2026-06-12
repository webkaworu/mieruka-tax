import { 
    useExpenditures, 
    useYears, 
    useOrganizations, 
    useDashboardStore, 
    TaxDonutChart, 
    TaxTreemap 
} from '@/features/dashboard';

import { ChevronLeft, ChevronRight, LayoutGrid, PieChart as PieChartIcon, Calendar, Building2 } from 'lucide-react';

import { Skeleton } from '@/components/ui/Skeleton';

export const DashboardPage = () => {
    const {
        selectedYear,
        lgCode,
        viewMode,
        history,
        setSelectedYear,
        setLgCode,
        setViewMode,
        drillDown: handleDrillDown,
        goBack: handleBack,
        resetHistory,
    } = useDashboardStore();

    const { data: years } = useYears();
    const { data: organizations } = useOrganizations('national');

    const currentLevel = history[history.length - 1];

    const { data, isLoading, error } = useExpenditures({
        year: selectedYear,
        lg_code: lgCode,
        parent_id: currentLevel.id,
    });

    const selectedOrg = organizations?.find((o: any) => o.lg_code === lgCode);

    if (error) {
        return (
            <div className="container mx-auto px-6 py-12 max-w-7xl">
                <div className="p-12 text-center bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-red-600 font-bold mb-2">エラーが発生しました</p>
                    <p className="text-red-400 text-sm">データの取得に失敗しました。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex animate-in fade-in duration-500 min-h-[calc(100vh-80px)]">
            {/* 左サイドバー */}
            <aside className="w-72 flex-shrink-0 bg-white border-r border-slate-100 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
                <div className="p-6 space-y-8">
                    {/* タイトル */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">財政データ</h2>
                        </div>
                        <p className="text-xs text-slate-400 font-medium pl-3.5">Fiscal Data Explorer</p>
                    </div>

                    {/* Fiscal Year */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Calendar className="w-3 h-3" />
                            Fiscal Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                            {years && years.length > 0 ? (
                                years.map((y: any) => (
                                    <option key={y} value={y}>{y}年度</option>
                                ))
                            ) : (
                                <option value={2024}>2024年度</option>
                            )}
                        </select>
                    </div>

                    {/* Organization */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Building2 className="w-3 h-3" />
                            Organization
                        </label>
                        <select
                            value={lgCode}
                            onChange={(e) => {
                                setLgCode(e.target.value);
                                resetHistory();
                            }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                            {organizations?.map((org: any) => (
                                <option key={org.lg_code} value={org.lg_code}>{org.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 階層ナビゲーション */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Level</p>
                        <div className="space-y-1">
                            {history.map((h, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                    {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0 mt-0.5" />}
                                    <span className={`text-xs font-bold break-all ${i === history.length - 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                                        {h.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {history.length > 1 && (
                            <button
                                onClick={handleBack}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                上の階層に戻る
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* メインコンテンツ */}
            <div className="flex-1 p-8 space-y-6 min-w-0">
                {/* ページヘッダー */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            {currentLevel.name}
                        </h2>
                        <p className="text-sm text-slate-400 font-medium mt-1">
                            {selectedYear}年度
                            {selectedOrg ? ` · ${selectedOrg.name}` : ''}
                        </p>
                    </div>

                    {/* ビュー切り替え */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl flex-shrink-0">
                        <button
                            onClick={() => setViewMode('treemap')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'treemap' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="ツリーマップ"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('donut')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'donut' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="ドーナツチャート"
                        >
                            <PieChartIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ビジュアライゼーション */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden min-h-[600px] flex flex-col p-8">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 rounded-l-[32px]" />
                    <div className="flex-1 flex items-center justify-center">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center gap-8 w-full">
                                <Skeleton className="w-64 h-64 rounded-full" />
                                <div className="w-48 h-4 bg-slate-100 rounded-full animate-pulse" />
                            </div>
                        ) : viewMode === 'treemap' ? (
                            <TaxTreemap data={data || []} onDrillDown={handleDrillDown} />
                        ) : (
                            <TaxDonutChart data={data || []} onDrillDown={handleDrillDown} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
