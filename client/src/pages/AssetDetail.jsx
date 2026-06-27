import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as assetAPI from '../api/assetAPI'
import * as maintenanceAPI from '../api/maintenanceAPI'
import StatusBadge from '../components/common/StatusBadge'
import Spinner from '../components/common/Spinner'
import useAuth from '../hooks/useAuth'

function unpack(res) {
  return res?.data?.data ?? res?.data ?? res
}

const STATUSES = ['Working', 'Damaged', 'Under Maintenance', 'Discarded', 'Lost']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const label = priority || '—'
  return <span className={`priority-badge priority-${label}`}>{label}</span>
}

export default function AssetDetail() {
  const { id } = useParams()
  const { canWrite, isMaintenance, isViewer } = useAuth()

  const [asset, setAsset] = useState(null)
  const [maintenanceHistory, setMaintenanceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newStatus, setNewStatus] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [showAutoLogInfo, setShowAutoLogInfo] = useState(false)

  const [reportIssueModal, setReportIssueModal] = useState(false)
  const [logSubmitting, setLogSubmitting] = useState(false)
  const [logForm, setLogForm] = useState({
    issue_title: '',
    issue_description: '',
    priority: 'Medium',
  })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await assetAPI.getAssetById(id)
      const assetData = res?.data?.data || res?.data || res
      setAsset(assetData)
      setMaintenanceHistory(assetData?.maintenance_history || [])
      setNewStatus(assetData?.status || 'Working')
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load asset'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  // keep derived history in state for safe mapping

  async function handleStatusUpdate() {
    if (!newStatus || newStatus === asset?.status) return
    setStatusUpdating(true)
    try {
      await assetAPI.updateAssetStatus(id, newStatus)
      if (newStatus === 'Damaged') {
        setShowAutoLogInfo(true)
        toast.success('⚠️ Marked as Damaged. Maintenance log auto-created.')
      } else {
        toast.success('Status updated.')
      }
      await load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  async function submitLog(e) {
    e.preventDefault()
    setLogSubmitting(true)
    try {
      if (!logForm.issue_title.trim()) {
        toast.error('Issue title is required')
        return
      }
      await maintenanceAPI.createLog({
        asset_id: id,
        issue_title: logForm.issue_title.trim(),
        issue_description: logForm.issue_description.trim() || undefined,
        priority: logForm.priority,
      })
      toast.success('Issue reported successfully.')
      setReportIssueModal(false)
      setLogForm({ issue_title: '', issue_description: '', priority: 'Medium' })
      await load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to report issue')
    } finally {
      setLogSubmitting(false)
    }
  }

  if (loading) return <Spinner fullPage />

  if (error) {
    return (
      <div className="card">
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Asset Detail</div>
        <div style={{ color: 'var(--color-danger)' }}>{error}</div>
      </div>
    )
  }

  const room = asset?.room_id
  const floor = room?.floor_id
  const block = floor?.block_id
  const isExpired = asset?.warranty_expiry
    ? new Date(asset.warranty_expiry).getTime() < new Date().setHours(0, 0, 0, 0)
    : false

  return (
    <>
      <div className="breadcrumb">
        <Link to="/assets">Assets</Link> <span>›</span> {block?.block_name || '—'} <span>›</span>{' '}
        {floor?.floor_label || '—'} <span>›</span>{' '}
        {room?._id ? <Link to={`/rooms/${room._id}`}>{room?.room_number || '—'}</Link> : '—'}{' '}
        <span>›</span> {asset?.asset_name || '—'}
      </div>

      <div className="asset-detail-grid">
        <div className="card">
          <h2 style={{ margin: 0 }}>{asset?.asset_name}</h2>
          <div style={{ marginTop: 8 }}>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                background: '#f0f4f8',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              {asset?.asset_code}
            </span>
          </div>

          <div className="info-grid">
            <div className="info-row">
              <label>Category</label>
              <span>{asset?.category || '—'}</span>
            </div>
            <div className="info-row">
              <label>Brand</label>
              <span>{asset?.brand || '—'}</span>
            </div>
            <div className="info-row">
              <label>Model No.</label>
              <span>{asset?.model_number || '—'}</span>
            </div>
            <div className="info-row">
              <label>Serial Number</label>
              <span>{asset?.serial_number || '—'}</span>
            </div>
            <div className="info-row">
              <label>Purchase Date</label>
              <span>
                {asset?.purchase_date
                  ? new Date(asset.purchase_date).toLocaleDateString('en-IN')
                  : '—'}
              </span>
            </div>
            <div className="info-row">
              <label>Purchase Cost</label>
              <span>
                {typeof asset?.purchase_cost === 'number'
                  ? `₹${asset.purchase_cost.toLocaleString('en-IN')}`
                  : '—'}
              </span>
            </div>
            <div className="info-row">
              <label>Warranty Expiry</label>
              <span style={isExpired ? { color: '#C0392B', fontWeight: 700 } : undefined}>
                {asset?.warranty_expiry
                  ? `${new Date(asset.warranty_expiry).toLocaleDateString('en-IN')}${
                      isExpired ? '  ⚠️ EXPIRED' : ''
                    }`
                  : '—'}
              </span>
            </div>
            <div className="info-row">
              <label>Added By</label>
              <span>{asset?.added_by?.username || asset?.created_by?.username || '—'}</span>
            </div>
            <div className="info-row">
              <label>Last Updated By</label>
              <span>{asset?.last_updated_by?.username || asset?.updated_by?.username || '—'}</span>
            </div>
          </div>

          <div style={{ marginTop: 6 }}>
            <h4 style={{ margin: '0 0 8px 0' }}>📍 Location</h4>
            {room?._id ? (
              <Link to={`/rooms/${room._id}`} style={{ color: 'var(--color-primary-light)' }}>
                {block?.block_name || '—'} › {floor?.floor_label || '—'} › {room?.room_number || '—'}{' '}
                {room?.room_name ? `- ${room.room_name}` : ''}
              </Link>
            ) : (
              <div style={{ color: 'var(--color-text-light)' }}>—</div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: 0 }}>Current Status</h3>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'inline-block', fontSize: 16 }}>
              <StatusBadge status={asset?.status} />
            </div>
          </div>

          {showAutoLogInfo ? (
            <div
              style={{
                background: '#FFF9E6',
                border: '1px solid #F39C12',
                borderRadius: 6,
                padding: 12,
                marginTop: 14,
                fontSize: 13,
              }}
            >
              ⚠️ A maintenance log has been auto-created. Check the Maintenance section.
            </div>
          ) : null}

          {(canWrite || isMaintenance) ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginBottom: 6 }}>
                Change Status
              </div>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 10 }}
                onClick={handleStatusUpdate}
                disabled={statusUpdating || newStatus === asset?.status}
              >
                {statusUpdating ? 'Updating…' : 'Update'}
              </button>
            </div>
          ) : null}

          {isViewer ? (
            <p style={{ marginTop: 14, color: 'var(--color-text-light)' }}>
              You have read-only access.
            </p>
          ) : null}

          {canWrite ? (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => setReportIssueModal(true)}
            >
              🔧 Report Issue
            </button>
          ) : null}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>
            Maintenance History ({maintenanceHistory?.length || 0})
          </h3>
          {canWrite ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setReportIssueModal(true)}>
              + Report Issue
            </button>
          ) : null}
        </div>

        {(maintenanceHistory || []).length ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Issue Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Reported By</th>
                  <th>Reported At</th>
                  <th>Resolved At</th>
                </tr>
              </thead>
              <tbody>
                {(maintenanceHistory || []).map((log) => (
                  <tr key={log._id}>
                    <td>{log?.issue_title || '—'}</td>
                    <td>
                      <PriorityBadge priority={log?.priority} />
                    </td>
                    <td>
                      <StatusBadge status={log?.repair_status} />
                    </td>
                    <td>{log?.assigned_to?.username || '—'}</td>
                    <td>{log?.reported_by?.username || '—'}</td>
                    <td>
                      {log?.reported_at ? new Date(log.reported_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      {log?.resolved_at ? new Date(log.resolved_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>📋</div>
            No maintenance history for this asset.
          </div>
        )}
      </div>

      {reportIssueModal ? (
        <Modal title="Report Maintenance Issue" onClose={() => setReportIssueModal(false)}>
          <form onSubmit={submitLog}>
            <div className="form-group">
              <label>Asset</label>
              <input className="form-control" value={asset?.asset_name || ''} disabled />
            </div>
            <div className="form-group">
              <label>Issue Title *</label>
              <input
                className="form-control"
                value={logForm.issue_title}
                onChange={(e) => setLogForm((p) => ({ ...p, issue_title: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Issue Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={logForm.issue_description}
                onChange={(e) => setLogForm((p) => ({ ...p, issue_description: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={logForm.priority}
                onChange={(e) => setLogForm((p) => ({ ...p, priority: e.target.value }))}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setReportIssueModal(false)} disabled={logSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={logSubmitting}>
                {logSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  )
}

