import { useSimulatorStore, useConversionUnits } from '@/features/simulator';
import { useExpenditures } from '@/features/dashboard';

export const SimulatorResult = () => {
  const { taxAmount } = useSimulatorStore();
  const { data: expenditures } = useExpenditures({ year: 2024, lg_code: '000000' }, { enabled: taxAmount > 0 });
  const { data: units } = useConversionUnits({ enabled: taxAmount > 0 });

  if (taxAmount <= 0) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
        <h3 className="text-blue-900 font-bold mb-2">あなたの税金の使い道 (年間)</h3>
        <p className="text-3xl font-black text-blue-600">
          ¥{taxAmount.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {expenditures?.map((item: any) => {
          const distributedAmount = (taxAmount * item.percentage) / 100;
          
          return (
            <div key={item.category_id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">{item.category_name}</h4>
                <p className="text-lg font-black text-slate-700">
                  ¥{Math.round(distributedAmount).toLocaleString()}
                </p>
              </div>
              
              {units && units.length > 0 ? (
                <div className="text-right bg-slate-50 px-3 py-2 rounded-xl">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    {units[0].name}換算
                  </p>
                  <p className="text-sm font-black text-orange-600">
                    約 {Math.floor(distributedAmount / units[0].unit_price).toLocaleString()} {units[0].name}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* 注釈・免責事項 */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
          免責事項・算出の仕組み
        </h4>
        <div className="space-y-4">
          <p className="text-[11px] text-slate-600 leading-relaxed">
            本シミュレーションで表示される金額は、財務省が公開している<strong>一般会計予算の構成比率</strong>を、入力いただいた納税額にそのまま適用して算出した「理論上の概算値」です。
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed border-l-2 border-blue-100 pl-4 py-0.5">
            実際には、所得の内訳（所得税・住民税など）、お住まいの自治体、あなたが利用されている行政サービスの種類によって、納めた税金が社会に還元される形は一人ひとり異なります。
          </p>
          <p className="text-[11px] text-slate-400 font-medium italic">
            ※ 本ツールは、行政の優先順位や予算の全体像を直感的に捉えるための「目安」としてご活用ください。
          </p>
        </div>
      </div>
    </div>
  );
};
