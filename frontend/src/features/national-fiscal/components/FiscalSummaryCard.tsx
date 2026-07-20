import React from 'react';
import { Coins, Receipt } from 'lucide-react';

interface FiscalSummaryCardProps {
  type: 'revenue' | 'expenditure';
  amount: number;
  label: string;
  subLabel?: string;
}

// 億円フォーマット
const formatToOku = (val: number) => {
  const oku = val / 100000000;
  return `${oku.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 億円`;
};

// 円フォーマット
const formatToYen = (val: number) => {
  return `${val.toLocaleString()} 円`;
};

export const FiscalSummaryCard: React.FC<FiscalSummaryCardProps> = ({ type, amount, label, subLabel }) => {
  const isRevenue = type === 'revenue';

  return (
    <div className="relative group overflow-hidden bg-slate-900/60 border border-slate-800 backdrop-blur-md p-6 rounded-2xl shadow-xl transition-all duration-300 hover:border-slate-700/60 hover:shadow-2xl flex flex-col justify-between">
      {/* 背景のグラデーション光 */}
      <div 
        className={`absolute -right-16 -top-16 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-300 group-hover:scale-125 ${
          isRevenue ? 'bg-emerald-500' : 'bg-blue-500'
        }`}
      />

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
          {subLabel && <p className="text-slate-500 text-xxs font-normal">{subLabel}</p>}
        </div>
        <div 
          className={`p-2.5 rounded-xl border ${
            isRevenue 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}
        >
          {isRevenue ? <Coins className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1 relative z-10">
        {/* ホバー時に円単位詳細をポップアップ表示するためのツールチップ効果 */}
        <div className="relative group/tooltip inline-block">
          <p 
            className={`text-3xl font-extrabold tracking-tight transition-all cursor-help ${
              isRevenue ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-blue-400 group-hover:text-blue-300'
            }`}
          >
            {formatToOku(amount)}
          </p>
          
          {/* ホバーポップアップ */}
          <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-max max-w-xs bg-slate-950 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-2xl text-slate-200 text-xs font-mono opacity-0 scale-95 origin-bottom transition-all duration-200 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 backdrop-blur-md">
            <span className="text-slate-400 text-xxs block mb-0.5">詳細金額 (円)</span>
            {formatToYen(amount)}
          </div>
        </div>
        
        <p className="text-slate-400 text-xs mt-1">
          {isRevenue ? '国庫に入る歳入の合計規模' : '国の各会計等における歳出合計規模'}
        </p>
      </div>
    </div>
  );
};
