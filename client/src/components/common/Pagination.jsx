function range(start, end) {
  const out = []
  for (let i = start; i <= end; i += 1) out.push(i)
  return out
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null

  const safeCurrent = Math.min(Math.max(1, currentPage || 1), totalPages)

  let start = Math.max(1, safeCurrent - 2)
  let end = Math.min(totalPages, start + 4)
  start = Math.max(1, end - 4)

  const pages = range(start, end)

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange?.(safeCurrent - 1)}
        disabled={safeCurrent === 1}
      >
        Previous
      </button>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {pages.map((p) => {
          const active = p === safeCurrent
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              className="btn btn-sm"
              style={{
                padding: '0.35rem 0.7rem',
                borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: active ? 'var(--color-primary)' : '#fff',
                color: active ? '#fff' : 'var(--color-text)',
              }}
            >
              {p}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange?.(safeCurrent + 1)}
        disabled={safeCurrent === totalPages}
      >
        Next
      </button>
    </div>
  )
}

