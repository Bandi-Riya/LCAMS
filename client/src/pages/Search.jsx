import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as searchAPI from '../api/searchAPI'
import Spinner from '../components/common/Spinner'
import StatusBadge from '../components/common/StatusBadge'
import useDebounce from '../hooks/useDebounce'

export default function Search() {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    let mounted = true
    async function run() {
      setError('')
      if (debouncedQuery.length < 2) {
        if (mounted) setResults(null)
        return
      }
      setLoading(true)
      try {
        const res = await searchAPI.search(debouncedQuery)
        const payload = res?.data?.data ?? res?.data ?? res
        if (mounted) setResults(payload)
      } catch (err) {
        const msg = err?.response?.data?.message || 'Search failed'
        if (mounted) setError(msg)
        toast.error(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [debouncedQuery])

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Search</h1>

      <div style={{ position: 'relative', marginBottom: 24 }}>
        <span
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 18,
          }}
        >
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for rooms, assets, equipment..."
          autoFocus
          style={{
            width: '100%',
            fontSize: 16,
            padding: '14px 14px 14px 44px',
            border: '2px solid var(--color-border)',
            borderRadius: 8,
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
        />
        {loading ? (
          <span
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <Spinner size="sm" />
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="card" style={{ color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : null}

      {query.length < 2 && !results ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            color: 'var(--color-text-light)',
            padding: 28,
          }}
        >
          <div style={{ fontSize: 48 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>
            Type at least 2 characters to search
          </div>
          <div style={{ marginTop: 6 }}>
            Search across all rooms and assets in the campus
          </div>
        </div>
      ) : loading && !results ? (
        <Spinner />
      ) : results?.total === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
          <div style={{ fontSize: 42 }}>😕</div>
          <div style={{ marginTop: 10 }}>
            No results found for <strong>{query}</strong>
          </div>
        </div>
      ) : results?.total > 0 ? (
        <div>
          <p style={{ marginTop: 0 }}>
            <strong>{results.total}</strong> result(s) for <strong>"{results.query}"</strong>
          </p>

          {results.rooms?.length ? (
            <>
              <h3 style={{ marginTop: 18 }}>🚪 Rooms ({results.rooms.length})</h3>
              <div className="asset-grid">
                {results.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="asset-card"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{room.room_number}</div>
                      {room.room_type ? (
                        <span className="chip chip-sm">{room.room_type}</span>
                      ) : null}
                    </div>
                    {room.name && room.name !== room.room_number ? (
                      <div style={{ marginTop: 6, color: 'var(--color-text-light)' }}>
                        {room.name}
                      </div>
                    ) : null}
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-text-light)' }}>
                      📍 {room.breadcrumb}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {room.seating_capacity ? (
                        <span className="chip chip-sm">Seats: {room.seating_capacity}</span>
                      ) : null}
                      {typeof room.has_projector === 'boolean' ? (
                        <span className={`chip chip-sm ${room.has_projector ? 'chip-green' : 'chip-gray'}`}>
                          📽️ {room.has_projector ? 'Yes' : 'No'}
                        </span>
                      ) : null}
                      {typeof room.has_ac === 'boolean' ? (
                        <span className={`chip chip-sm ${room.has_ac ? 'chip-green' : 'chip-gray'}`}>
                          ❄️ {room.has_ac ? 'Yes' : 'No'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {results.assets?.length ? (
            <>
              <h3 style={{ marginTop: 18 }}>📦 Assets ({results.assets.length})</h3>
              <div className="asset-grid">
                {results.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="asset-card"
                    onClick={() => navigate(`/assets/${asset.id}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontWeight: 800 }}>{asset.name}</div>
                      {asset.category ? (
                        <span className="chip chip-sm">{asset.category}</span>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <StatusBadge status={asset.status} />
                    </div>
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-text-light)' }}>
                      📍 {asset.breadcrumb}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>
                        {asset.asset_code}
                      </span>
                      <span style={{ color: 'var(--color-text-light)', fontSize: 12 }}>
                        {asset.brand || ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

