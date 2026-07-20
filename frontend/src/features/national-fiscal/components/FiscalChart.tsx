import React from 'react';
import { Treemap, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ExpenditureSummary } from '@mieruka-tax/shared';

interface FiscalChartProps {
  data: ExpenditureSummary[];
  chartType: 'treemap' | 'donut';
  onCategoryClick: (id: string, name: string) => void;
}

// プレミアムカラーパレット
const COLORS = [
  'hsl(215, 80%, 50%)', // 青
  'hsl(145, 65%, 45%)', // 緑
  'hsl(35, 85%, 55%)',  // オレンジ
  'hsl(280, 65%, 55%)', // 紫
  'hsl(9, 75%, 55%)',   // 赤
  'hsl(185, 75%, 40%)', // ターコイズ
  'hsl(330, 75%, 55%)', // ピンク
  'hsl(240, 50%, 65%)', // ラベンダー
];

// 金額フォーマッタ (億円単位)
const formatToOku = (value: number) => {
  return `${(value / 100000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}億円`;
};

// 金額フォーマッタ (円単位)
const formatToYen = (value: number) => {
  return `${value.toLocaleString()}円`;
};

// カスタムツールチップ
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/90 border border-slate-700/50 backdrop-blur-md p-3 rounded-lg shadow-xl text-white text-sm">
        <p className="font-bold border-b border-slate-700/50 pb-1.5 mb-1.5">{data.category_name || data.name}</p>
        <p className="text-slate-300">
          金額: <span className="font-semibold text-emerald-400">{formatToOku(data.amount || data.value)}</span>
        </p>
        <p className="text-xs text-slate-400 mb-1">({formatToYen(data.amount || data.value)})</p>
        <p className="text-slate-300">
          割合: <span className="font-semibold text-blue-400">{(data.percentage || 0).toFixed(2)}%</span>
        </p>
        {data.has_children && (
          <p className="text-xs text-slate-400 mt-1.5 italic">※クリックすると詳細を可視化</p>
        )}
      </div>
    );
  }
  return null;
};

const CustomizedTreemapContent = (props: any) => {
  const { x, y, width, height, index } = props;
  
  // payloadやpropsから安全に値を取得し、デフォルトフォールバックを適用する
  const category_name = props.category_name ?? props.name ?? props.payload?.category_name ?? '';
  const percentage = props.percentage ?? props.payload?.percentage ?? 0;
  const has_children = props.has_children ?? props.payload?.has_children ?? false;

  // ラベルを描画するのに十分なスペースがあるか
  if (width < 60 || height < 40) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: '#0f172a',
          strokeWidth: 1.5,
          cursor: has_children ? 'pointer' : 'default',
        }}
        className="transition-all duration-300 hover:brightness-110"
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 8}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={Math.min(14, width / 8)}
        fontWeight="bold"
        className="pointer-events-none select-none drop-shadow-md"
      >
        {category_name}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 10}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={Math.min(12, width / 9)}
        className="pointer-events-none select-none drop-shadow"
      >
        {percentage.toFixed(1)}%
      </text>
    </g>
  );
};

export const FiscalChart: React.FC<FiscalChartProps> = ({ data, chartType, onCategoryClick }) => {
  // ツリーマップのハンドラ
  const handleTreemapClick = (node: any) => {
    if (node && node.has_children) {
      onCategoryClick(node.category_id, node.category_name);
    }
  };

  // ドーナツチャートのデータ変換
  const donutData = data.map((item) => ({
    name: item.category_name,
    value: item.amount,
    percentage: item.percentage,
    category_id: item.category_id,
    has_children: item.has_children,
  }));

  // ドーナツチャートのクリック
  const handleDonutClick = (node: any) => {
    if (node && node.has_children) {
      onCategoryClick(node.category_id, node.name);
    }
  };

  if (chartType === 'treemap') {
    return (
      <div className="w-full h-[600px] bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl shadow-inner relative overflow-hidden backdrop-blur-sm">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="amount"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={<CustomizedTreemapContent />}
            onClick={(e: any) => {
              if (e && e.category_id) {
                // Recharts の Treemap の onClick 引数は特殊な形状をしているため、
                // クリックされたオブジェクトを見つけてハンドラに渡します。
                const clickedItem = data.find(d => d.category_id === e.category_id);
                if (clickedItem) handleTreemapClick(clickedItem);
              }
            }}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl shadow-inner relative flex flex-col md:flex-row items-center justify-center backdrop-blur-sm">
      <div className="w-full md:w-3/5 h-[450px] md:h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={110}
              outerRadius={180}
              paddingAngle={2}
              dataKey="value"
              onClick={handleDonutClick}
              className="cursor-pointer"
            >
              {donutData.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="transition-all duration-300 hover:brightness-110"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* カスタム凡例 */}
      <div className="w-full md:w-2/5 max-h-[520px] overflow-y-auto px-4 mt-4 md:mt-0 flex flex-col gap-2">
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mb-1">費目構成比</p>
        {donutData.map((item, index) => (
          <div 
            key={item.category_id}
            onClick={() => handleDonutClick(item)}
            className={`flex items-center justify-between p-2 rounded-lg text-sm transition-all ${
              item.has_children ? 'hover:bg-slate-800/40 cursor-pointer' : 'hover:bg-slate-800/10'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-slate-200 font-medium truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <span className="text-emerald-400 font-semibold">{formatToOku(item.value)}</span>
              <span className="text-slate-400 font-mono text-xs min-w-[45px]">{item.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
