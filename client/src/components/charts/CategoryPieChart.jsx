import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const COLORS = [
  '#1E3A5F',
  '#2C5F8A',
  '#E8A020',
  '#27AE60',
  '#C0392B',
  '#F39C12',
  '#95A5A6',
]

export default function CategoryPieChart({ data }) {
  const safeData = Array.isArray(data) ? data.filter((d) => (d?.value || 0) > 0) : []
  if (safeData.length === 0) return <p>No data available.</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Tooltip />
        <Pie
          data={safeData}
          dataKey="value"
          nameKey="name"
          innerRadius={48}
          outerRadius={80}
          paddingAngle={2}
        >
          {safeData.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          height={40}
          wrapperStyle={{ fontSize: 12, color: 'var(--color-text-light)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

