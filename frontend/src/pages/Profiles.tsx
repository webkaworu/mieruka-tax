import { useState } from 'react';
import { useOrganizations, useOrganization, useExpenditures, TaxDonutChart } from '@/features/dashboard';
import { Building2, MapPin, TrendingUp, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export const ProfilesPage = () => {
  const [selectedLgCode, setSelectedLgCode] = useState<string | null>(null);
  const { data: orgs, isLoading: isLoadingList } = useOrganizations();
  const { data: org } = useOrganization(selectedLgCode || '');
  const { data: expenditures, isLoading: isLoadingExp } = useExpenditures(
    {
      lg_code: selectedLgCode || '',
      year: 2024,
    },
    { enabled: !!selectedLgCode }
  );

  if (selectedLgCode && org) {
    return (
      <div className="container mx-auto py-12 px-6 max-w-7xl">
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <button 
          onClick={() => setSelectedLgCode(null)}
          className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          ← 組織一覧に戻る
        </button>

        {/* Header */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                {org.type}
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                {org.name}
              </h2>
              <div className="flex items-center gap-4 text-slate-500 font-bold text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Code: {org.lg_code}
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  ID: {org.id.split('-')[0]}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Budget (FY2024)</p>
              <p className="text-3xl font-black text-blue-600 tabular-nums">
                ¥{expenditures?.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-7 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-tight">
              Spending Composition
            </h3>
            {isLoadingExp ? (
              <Skeleton className="w-full h-[400px] rounded-2xl" />
            ) : (
              <TaxDonutChart data={expenditures || []} onDrillDown={() => {}} />
            )}
          </div>

          {/* Key Projects/Categories */}
          <div className="lg:col-span-5 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-tight">
              Major Categories
            </h3>
            <div className="space-y-4">
              {expenditures?.slice(0, 5).map((item: any, i: number) => (
                <div key={item.category_id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-slate-200 italic">0{i+1}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.category_name}</p>
                      <p className="text-[10px] font-black text-blue-600 font-mono italic">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-slate-900">
                    {(item.amount / 100000000).toLocaleString()} 億円
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-6 max-w-7xl">
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="max-w-2xl">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 uppercase">
          Organization Profiles
        </h2>
        <p className="text-slate-500 font-medium leading-relaxed">
          各省庁や地方自治体の予算規模と支出構造を個別に確認できます。
          組織を選択して、詳細なプロファイルを表示してください。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingList ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[32px]" />
          ))
        ) : (
          orgs?.map((org: any) => (
            <div 
              key={org.id}
              onClick={() => setSelectedLgCode(org.lg_code)}
              className="group bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-100 cursor-pointer transition-all duration-300 relative overflow-hidden"
            >
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {org.type}
                  </div>
                  <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight group-hover:text-blue-600 transition-colors">
                    {org.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-400">Code: {org.lg_code}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  View Profile <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
};
