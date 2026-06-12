import { 
  Treemap, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

interface ExpenditureData {
  category_id: string;
  category_name: string;
  amount: number;
  percentage: number;
  has_children: boolean;
}

interface TaxTreemapProps {
  data: ExpenditureData[];
  onDrillDown: (categoryId: string, categoryName: string) => void;
}

const COLORS = [
  '#003E70', '#0068BC', '#326691', '#F58700', '#EB1400', '#5C5C5C', '#757575',
];

const CustomizedContent = (props: any) => {
  const { depth, x, y, width, height, index, name } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1),
          strokeOpacity: 1 / (depth + 1),
        }}
      />
      {width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
          className="pointer-events-none select-none"
        >
          {name}
        </text>
      )}
    </g>
  );
};

const yenFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

export const TaxTreemap = ({ data, onDrillDown }: TaxTreemapProps) => {
  // Treemap用にデータを変換
  const treemapData = data.map(item => ({
    name: item.category_name,
    size: item.amount,
    ...item
  }));

  const formatYen = (value: number) => {
    return yenFormatter.format(value);
  };

  return (
    <div className="h-[500px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treemapData}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#fff"
          content={<CustomizedContent />}
          onClick={(node: any) => {
            if (node.has_children) {
              onDrillDown(node.category_id, node.category_name);
            }
          }}
        >
          <Tooltip 
            formatter={(value: number) => [formatYen(value), '支出額']}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};
