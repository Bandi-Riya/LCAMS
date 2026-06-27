import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getSummary } from '../api/analyticsAPI'
import Spinner from '../components/common/Spinner'
import StatusBadge from '../components/common/StatusBadge'
import AssetStatusChart from '../components/charts/AssetStatusChart'
import CategoryPieChart from '../components/charts/CategoryPieChart'

function PriorityBadge({ priority }) {
  const label = priority || '—'
  const cls = `priority-badge priority-${label}`
  return <span className={cls}>{label}</span>
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState({
    total_blocks: 0,
    total_floors: 0,
    total_rooms: 0,
    total_assets: 0,
    total_users: 0,
    pending_maintenance_count: 0,
    active_maintenance_count: 0,
    assets_by_status: {
      Working: 0,
      Damaged: 0,
      'Under Maintenance': 0,
      Discarded: 0,
      Lost: 0,
    },
    assets_by_category: {
      Electronics: 0,
Furniture: 0,
      'Laboratory Equipment': 0,
      Electrical: 0,
      'IT Infrastructure': 0,
      'Safety Equipment': 0,
      Other: 0,
    },
    rooms_by_type: {
      Classroom: 0,
      'Smart Classroom': 0,
      Laboratory: 0,
      'HOD Office': 0,
      'Faculty Room': 0,
      Auditorium: 0,
      'Conference Room': 0,
      'Store Room': 0,
      Other: 0,
    },
    maintenance_by_status: {
      Pending: 0,
      'In Progress': 0,
      Resolved: 0,
      Closed: 0,
    },
    top_damaged_blocks: [],
    recent_maintenance: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await getSummary();
        
        // Handle all possible response shapes
        let d = null;
        if (res?.data?.data) d = res.data.data;
        else if (res?.data) d = res.data;
        else if (res) d = res;

        if (d && typeof d === 'object') {
          setAnalytics(prev => ({
            ...prev,
            ...d,
            assets_by_status: { ...prev.assets_by_status, ...(d.assets_by_status || {}) },
            assets_by_category: { ...prev.assets_by_category, ...(d.assets_by_category || {}) },
            rooms_by_type: { ...prev.rooms_by_type, ...(d.rooms_by_type || {}) },
            maintenance_by_status: { ...prev.maintenance_by_status, ...(d.maintenance_by_status || {}) },
            top_damaged_blocks: Array.isArray(d.top_damaged_blocks) ? d.top_damaged_blocks : [],
            recent_maintenance: Array.isArray(d.recent_maintenance) ? d.recent_maintenance : [],
          }));
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
        const msg = err?.response?.data?.message || 'Failed to load dashboard data.';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const assetStatusData = useMemo(() => {
    const s = analytics?.assets_by_status || {}
    return [
      { name: 'Working', value: s?.Working ?? 0, fill: '#27AE60' },
      { name: 'Damaged', value: s?.Damaged ?? 0, fill: '#C0392B' },
      {
        name: 'Under Maint.',
        value: s?.['Under Maintenance'] ?? 0,
        fill: '#F39C12',
      },
      { name: 'Discarded', value: s?.Discarded ?? 0, fill: '#95A5A6' },
    ]
  }, [analytics])

  const categoryData = useMemo(() => {
    const obj = analytics?.assets_by_category || {}
    return Object.entries(obj || {}).map(([name, value]) => ({ name, value }))
  }, [analytics])

  if (loading) return <Spinner fullPage />

  if (error) {
    return (
      <div className="card">
        <div style={{ fontSize: 18, fontWeight: 800 }}>Dashboard</div>
        <div style={{ marginTop: 10, color: 'var(--color-danger)' }}>{error}</div>
      </div>
    )
  }

  const pending = analytics?.pending_maintenance_count ?? 0

  return (
    <div>
      <div className="stat-cards-row">
        <div className="stat-card">
          <div style={{ fontSize: 22 }}>🏗️</div>
          <div className="stat-number">{analytics?.total_blocks ?? 0}</div>
          <div className="stat-label">Total Blocks</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 22 }}>📐</div>
          <div className="stat-number">{analytics?.total_floors ?? 0}</div>
          <div className="stat-label">Total Floors</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 22 }}>🚪</div>
          <div className="stat-number">{analytics?.total_rooms ?? 0}</div>
          <div className="stat-label">Total Rooms</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 22 }}>📦</div>
          <div className="stat-number">{analytics?.total_assets ?? 0}</div>
          <div className="stat-label">Total Assets</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 22 }}>🔧</div>
          <div
            className="stat-number"
            style={{
              color:
                pending > 0 ? 'var(--color-danger)' : 'var(--color-success)',
            }}
          >
            {pending}
          </div>
          <div className="stat-label">Pending Repairs</div>
        </div>
      </div>

      <div className="dashboard-row2">
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            Asset Status Overview
          </div>
          <AssetStatusChart data={assetStatusData} />
        </div>

        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            Assets by Category
          </div>
          <CategoryPieChart data={categoryData} />
        </div>

        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            Room Types
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(analytics?.rooms_by_type || {})
              .filter(([, v]) => (v || 0) > 0)
              .map(([k, v]) => (
                <div
                  key={k}
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            {Object.entries(analytics?.rooms_by_type || {}).filter(([, v]) => (v || 0) > 0)
              .length === 0 ? (
              <div style={{ color: 'var(--color-text-light)' }}>No room data.</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            Recent Maintenance Activity
          </div>
          <Link to="/maintenance" style={{ color: 'var(--color-primary-light)' }}>
            View All →
          </Link>
        </div>

        {Array.isArray(analytics?.recent_maintenance) && analytics.recent_maintenance.length ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Reported By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.recent_maintenance || []).slice(0, 5).map((m) => (
                  <tr key={m?._id || `${m?.asset_name}-${m?.reported_at}`}>
                    <td>{m?.asset_name || '—'}</td>
                    <td>{m?.issue_title || '—'}</td>
                    <td>
                      <PriorityBadge priority={m?.priority} />
                    </td>
                    <td>
                      <StatusBadge status={m?.repair_status} />
                    </td>
                    <td>{m?.reported_by?.username || m?.reported_by_name || '—'}</td>
                    <td>
                      {m?.reported_at
                        ? new Date(m.reported_at).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-light)' }}>
            No recent maintenance activity.
          </div>
        )}
      </div>
    </div>
  )
}

