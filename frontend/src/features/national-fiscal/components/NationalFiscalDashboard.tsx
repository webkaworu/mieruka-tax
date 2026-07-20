import React, { useMemo } from 'react';
import { useNationalFiscalStore } from '../store/useNationalFiscalStore';
import { useNationalExpenditures, useFiscalRevenue, useFiscalAvailability } from '../hooks/useNationalFiscal';
import { FiscalSummaryCard } from './FiscalSummaryCard';
import { FiscalChart } from './FiscalChart';
import { Calendar, Sliders, ChevronRight, CornerUpLeft, BarChart3, PieChart as PieIcon, LayoutGrid } from 'lucide-react';
import { AccountType } from '@mieruka-tax/shared';

// 利用可能な年度の一覧
const AVAILABLE_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

export const NationalFiscalDashboard: React.FC = () => {
  const {
    year,
    dataType,
    accountType,
    budgetRevision,
    chartType,
    categoryPath,
    setYear,
    setDataType,
    setAccountType,
    setBudgetRevision,
    setChartType,
    pushCategory,
    popCategory,
    resetCategoryPath,
  } = useNationalFiscalStore();

  // 決算公開状況のフェッチ
  const { data: availability } = useFiscalAvailability();

  // 決算が公開されている年度のセットを構築
  const publishedYears = useMemo(() => {
    if (!availability) {
      // APIが無い場合のフォールバック: 2024年以前は公開、2025年以降は未公開
      return new Set(AVAILABLE_YEARS.filter(y => y <= 2024));
    }
    return new Set(
      availability
        .filter(a => a.account_type === accountType && a.is_published)
        .map(a => a.year)
    );
  }, [availability, accountType]);

  // 決算選択時、現在選択されている年度が未公開なら、公開済みの最新年度に自動補正する
  React.useEffect(() => {
    if (dataType === 'settlement' && !publishedYears.has(year)) {
      const latestPublished = AVAILABLE_YEARS.find(y => publishedYears.has(y));
      if (latestPublished) {
        setYear(latestPublished);
      }
    }
  }, [dataType, publishedYears, year, setYear]);

  // 現在の階層（ドリルダウン用parentId）
  const currentParentId = categoryPath.length > 0 ? categoryPath[categoryPath.length - 1].id : null;

  // 歳出データの取得
  const { data: expenditures = [], isLoading: isExpendituresLoading } = useNationalExpenditures({
    year,
    parentId: currentParentId,
    dataType,
    accountType,
    budgetRevision: dataType === 'budget' ? budgetRevision : null,
  });

  // 歳入データの取得
  const { data: revenueAmount = 0 } = useFiscalRevenue({
    year,
    dataType,
    accountType,
    budgetRevision: dataType === 'budget' ? budgetRevision : null,
  });

  // 歳出合計額の算出
  const totalExpenditureAmount = useMemo(() => {
    return expenditures.reduce((sum, item) => sum + item.amount, 0);
  }, [expenditures]);

  // 会計区分の日本語ラベル
  const accountLabels: Record<AccountType, string> = {
    general: '一般会計',
    special: '特別会計',
    government_related: '政府関係機関',
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 text-slate-100 min-h-[calc(100vh-160px)]">
      
      {/* 左サイドバー: フィルターとサマリー */}
      <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
        
        {/* フィルターパネル */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-5 rounded-2xl shadow-xl flex flex-col gap-5">
          
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-blue-400" />
              <span>表示データ</span>
            </h3>
            {/* 予算/決算 切り替えトグル */}
            <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-850 flex items-center w-full">
              <button
                onClick={() => setDataType('budget')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  dataType === 'budget'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                予算案
              </button>
              <button
                onClick={() => setDataType('settlement')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  dataType === 'settlement'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                決算実績
              </button>
            </div>
          </div>

          {/* 年度セレクト */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>対象年度</span>
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-slate-700 transition-all font-semibold cursor-pointer"
            >
              {AVAILABLE_YEARS.map((y) => {
                const isAvailable = dataType === 'budget' || publishedYears.has(y);
                return (
                  <option 
                    key={y} 
                    value={y} 
                    disabled={!isAvailable}
                    className={!isAvailable ? 'text-slate-600 bg-slate-950' : 'text-slate-200 bg-slate-950'}
                  >
                    {y}年度 {!isAvailable && '(決算未公開)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 補正予算セレクト (予算の時のみ表示) */}
          {dataType === 'budget' && (
            <div className="flex flex-col gap-2 animate-fade-in">
              <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>補正予算</span>
              </label>
              <select
                value={budgetRevision}
                onChange={(e) => setBudgetRevision(Number(e.target.value))}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-slate-700 transition-all font-semibold cursor-pointer"
              >
                <option value={0} className="bg-slate-950">当初予算</option>
                <option value={1} className="bg-slate-950">補正予算 第1号</option>
                <option value={2} className="bg-slate-950">補正予算 第2号</option>
                <option value={3} className="bg-slate-950">補正予算 第3号</option>
              </select>
            </div>
          )}

          {/* 会計区分タブ (縦並び) */}
          <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-4">
            <label className="text-xs font-bold text-slate-400">会計区分</label>
            <div className="flex flex-col gap-1 bg-slate-950/40 p-1.5 rounded-xl border border-slate-850">
              {(['general', 'special', 'government_related'] as AccountType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAccountType(tab)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-all duration-250 ${
                    accountType === tab
                      ? 'bg-slate-800 text-white shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/10'
                  }`}
                >
                  {accountLabels[tab]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 財政サマリー表示 (縦並び) */}
        <div className="flex flex-col gap-4">
          <FiscalSummaryCard
            type="revenue"
            amount={revenueAmount}
            label="歳入（収入）合計"
            subLabel={`${year}年度 / ${dataType === 'budget' ? '予算案' : '決算実績'}`}
          />
        </div>
      </aside>

      {/* 右メインエリア: グラフとドリルダウン */}
      <main className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl flex flex-col gap-6 flex-grow">
          
          {/* ナビゲーションとチャート切り替えヘッダー */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            
            {/* パンくずリスト */}
            <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-400">
              <span 
                onClick={resetCategoryPath}
                className="hover:text-slate-200 transition-colors cursor-pointer text-slate-300 font-bold"
              >
                国家財政
              </span>
              {categoryPath.map((node, index) => (
                <React.Fragment key={node.id}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span 
                    onClick={() => {
                      const idx = categoryPath.findIndex(n => n.id === node.id);
                      if (idx !== -1) {
                        useNationalFiscalStore.setState({
                          categoryPath: categoryPath.slice(0, idx + 1)
                        });
                      }
                    }}
                    className={`transition-colors truncate max-w-[120px] md:max-w-xs ${
                      index === categoryPath.length - 1
                        ? 'text-blue-400 font-bold'
                        : 'hover:text-slate-200 cursor-pointer text-slate-300'
                    }`}
                  >
                    {node.name}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* 戻るボタン */}
              {categoryPath.length > 0 && (
                <button
                  onClick={popCategory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-800/60 transition-all font-semibold"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>戻る</span>
                </button>
              )}

              {/* チャート切り替え */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/60 gap-1">
                <button
                  onClick={() => setChartType('treemap')}
                  className={`p-1.5 rounded-lg transition-all ${
                    chartType === 'treemap' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="ツリーマップ"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartType('donut')}
                  className={`p-1.5 rounded-lg transition-all ${
                    chartType === 'donut' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="ドーナツチャート"
                >
                  <PieIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <FiscalSummaryCard
            type="expenditure"
            amount={totalExpenditureAmount}
            label={categoryPath.length > 0 ? `${categoryPath[categoryPath.length - 1].name} 内訳合計` : '歳出（支出）合計'}
            subLabel={`${year}年度 / ${dataType === 'budget' ? '予算案' : '決算実績'} (${accountLabels[accountType]}${dataType === 'budget' && budgetRevision > 0 ? ` / 補正第${budgetRevision}号` : ''})`}
          />

          {/* グラフ描画エリア */}
          {isExpendituresLoading ? (
            <div className="w-full min-h-[600px] flex-grow bg-slate-900/40 border border-slate-850/80 rounded-2xl flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <p className="text-sm text-slate-500">データを読み込み中...</p>
              </div>
            </div>
          ) : expenditures.length === 0 ? (
            <div className="w-full min-h-[600px] flex-grow bg-slate-900/40 border border-slate-850/80 rounded-2xl flex items-center justify-center">
              <p className="text-sm text-slate-500">表示可能なデータがありません。</p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-center">
              <FiscalChart
                data={expenditures}
                chartType={chartType}
                onCategoryClick={(id, name) => {
                  if (categoryPath.length === 0) {
                    pushCategory(id, name);
                  }
                }}
              />
            </div>
          )}
        </div>
      </main>

    </div>
  );
};
