import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = [
  '#378ADD', '#1D9E75', '#7F77DD',
  '#D85A30', '#BA7517'
];

export default function TrendLineChart({ data = [], categories }) {
  // If no categories passed (e.g. Dashboard), auto-detect numeric keys from data
  const resolvedCategories = categories
    ? categories
    : data.length > 0
      ? Object.keys(data[0]).filter(k => k !== 'month' && k !== 'name')
      : [];

  // Dashboard uses 'name' as x-axis key; Analytics uses 'month'
  const xKey = data.length > 0 && 'name' in data[0] ? 'name' : 'month';

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={v => `$${v.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
          />
          <Legend />
          {resolvedCategories.map((cat, i) => (
            <Line
              key={cat}
              type="monotone"
              dataKey={cat}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
