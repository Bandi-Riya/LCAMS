export default function Spinner({ fullPage = false, size = 'md' }) {
  const px = size === 'sm' ? 20 : size === 'lg' ? 52 : 36
  const border = Math.max(3, Math.round(px / 9))

  const spinnerEl = (
    <div
      className="spinner"
      style={{
        width: px,
        height: px,
        borderWidth: border,
        borderColor: 'var(--color-primary) transparent transparent transparent',
      }}
      aria-label="Loading"
    />
  )

  if (!fullPage) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
        {spinnerEl}
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(244, 246, 249, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
      }}
    >
      {spinnerEl}
    </div>
  )
}

