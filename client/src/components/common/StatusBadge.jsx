const COLORS = {
  Working: '#27AE60',
  Damaged: '#C0392B',
  'Under Maintenance': '#F39C12',
  Discarded: '#95A5A6',
  Lost: '#922B21',
  Pending: '#2980B9',
  'In Progress': '#E67E22',
  Resolved: '#27AE60',
  Closed: '#7F8C8D',
}

export default function StatusBadge({ status }) {
  const label = status || 'Unknown'
  const bg = COLORS[label] || '#95A5A6'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px 10px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 700,
        color: '#fff',
        backgroundColor: bg,
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}
      title={label}
    >
      {label}
    </span>
  )
}

