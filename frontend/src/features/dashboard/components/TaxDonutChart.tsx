import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';

interface ExpenditureData {
  category_id: string;
  category_name: string;
  amount: number;
  percentage: number;
  has_children: boolean;
}

interface TaxDonutChartProps {
  data: ExpenditureData[];
  onDrillDown: (categoryId: string, categoryName: string) => void;
}

// グラフの色定義
const COLORS = [
  '#003E70', // Brand Navy
  '#0068BC', // CTA Blue
  '#326691', // Link Blue
  '#F58700', // Subscription Orange
  '#EB1400', // LIVE Red
  '#5C5C5C', // Text Sub
  '#757575', // Text Sub 2
];

const yenFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

export const TaxDonutChart = ({ data, onDrillDown }: TaxDonutChartProps) => {
  const formatYen = (value: number) => {
    return yenFormatter.format(value);
  };

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={5}
            dataKey="amount"
            nameKey="category_name"
            onClick={(entry) => {
              if (entry.has_children) {
                onDrillDown(entry.category_id, entry.category_name);
              }
            }}
            cursor="pointer"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [formatYen(value), '支出額']}
          />
          <Legend layout="vertical" align="right" verticalAlign="middle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
