import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSimulatorStore } from '@/features/simulator';

const schema = z.object({
  taxAmount: z.number().min(0, '納税額は0以上で入力してください'),
});

type FormData = z.infer<typeof schema>;

export const TaxSimulatorForm = () => {
  const { taxAmount, setTaxAmount } = useSimulatorStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { taxAmount },
  });

  const onSubmit = (data: FormData) => {
    setTaxAmount(data.taxAmount);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">
        あなたの納税額を入力
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            年間納税額 (概算)
          </label>
          <div className="relative">
            <input
              type="number"
              {...register('taxAmount', { valueAsNumber: true })}
              className="w-full pl-3 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="例: 500000"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-slate-500 sm:text-sm">円</span>
            </div>
          </div>
          {errors.taxAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.taxAmount.message}</p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          計算する
        </button>
      </form>
      <p className="mt-4 text-xs text-slate-500 leading-relaxed">
        ※ 住民税や所得税の合計額を入力してください。入力された数値に基づき、国の予算比率で配分を計算します。
      </p>
    </div>
  );
};
