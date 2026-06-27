import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as maintenanceAPI from '../api/maintenanceAPI'
import * as assetAPI from '../api/assetAPI'
import axiosInstance from '../api/axiosInstance'
import Spinner from '../components/common/Spinner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Pagination from '../components/common/Pagination'
import StatusBadge from '../components/common/StatusBadge'
import useAuth from '../hooks/useAuth'

const ITEMS_PER_PAGE = 10
const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

function unpackList(res) {
  const v = res?.data?.data || res?.data || res || []
  return Array.isArray(v) ? v : []
}

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

export default function Maintenance() {
  const { canWrite, isAdmin, isMaintenance } = useAuth()

  const [allLogs, setAllLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    repair_status: '',
    priority: '',
    from_date: '',
    to_date: '',
  })
  const [currentPage, setCurrentPage] = useState(1)

  const [createModal, setCreateModal] = useState(false)
  const [updateStatusModal, setUpdateStatusModal] = useState(null) // {log} | null
  const [assignModal, setAssignModal] = useState(null) // {log} | null
  const [confirmState, setConfirmState] = useState({ isOpen: false })
  const [submitting, setSubmitting] = useState(false)
  const [maintenanceUsers, setMaintenanceUsers] = useState([])

  async function load() {
    setLoading(true)
    try {
      const [logsRes, usersRes] = await Promise.all([
        maintenanceAPI.getLogs(),
        axiosInstance.get('/users'),
      ])
      const list = logsRes?.data?.data || logsRes?.data || logsRes || []
      setAllLogs(Array.isArray(list) ? list : [])

      const users = unpackList(usersRes)
      setMaintenanceUsers(
        users.filter((u) => u?.role_id?.role_name === 'Maintenance'),
      )
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load maintenance logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredLogs = useMemo(() => {
    if (!Array.isArray(allLogs)) return []
    const from = filters.from_date ? new Date(filters.from_date).getTime() : null
    const to = filters.to_date ? new Date(filters.to_date).getTime() : null

    return (allLogs || []).filter((log) => {
      if (filters.repair_status && log?.repair_status !== filters.repair_status) return false
      if (filters.priority && log?.priority !== filters.priority) return false

      const reportedAt = log?.reported_at ? new Date(log.reported_at).getTime() : null
      if (from && reportedAt && reportedAt < from) return false
      if (to && reportedAt && reportedAt > to + 24 * 60 * 60 * 1000 - 1) return false

      return true
    })
  }, [allLogs, filters])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE))
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredLogs, currentPage])

  const pendingCount = useMemo(
    () => filteredLogs.filter((l) => l?.repair_status === 'Pending').length,
    [filteredLogs],
  )
  const inProgressCount = useMemo(
    () => filteredLogs.filter((l) => l?.repair_status === 'In Progress').length,
    [filteredLogs],
  )

  const [createForm, setCreateForm] = useState({
    asset_id: '',
    issue_title: '',
    issue_description: '',
    priority: 'Medium',
  })
  const [assetsForSelect, setAssetsForSelect] = useState([])
  const [loadingAssets, setLoadingAssets] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadAssets() {
      if (!createModal) return
      setLoadingAssets(true)
      try {
        const res = await assetAPI.getAssets()
        const list = unpackList(res).slice().sort((a, b) => {
          const an = (a?.asset_name || '').toLowerCase()
          const bn = (b?.asset_name || '').toLowerCase()
          return an.localeCompare(bn)
        })
        if (mounted) setAssetsForSelect(list)
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load assets')
      } finally {
        if (mounted) setLoadingAssets(false)
      }
    }
    loadAssets()
    return () => {
      mounted = false
    }
  }, [createModal])

  async function submitCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (!createForm.asset_id || !createForm.issue_title.trim()) {
        toast.error('Asset and Issue Title are required')
        return
      }
      await maintenanceAPI.createLog({
        asset_id: createForm.asset_id,
        issue_title: createForm.issue_title.trim(),
        issue_description: createForm.issue_description.trim() || undefined,
        priority: createForm.priority,
      })
      toast.success('Issue reported.')
      setCreateModal(false)
      setCreateForm({ asset_id: '', issue_title: '', issue_description: '', priority: 'Medium' })
      await load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create log')
    } finally {
      setSubmitting(false)
    }
  }

  const [statusForm, setStatusForm] = useState({ repair_status: 'Pending', resolution_notes: '' })
  useEffect(() => {
    if (!updateStatusModal?.log) return
    setStatusForm({
      repair_status: updateStatusModal.log.repair_status || 'Pending',
      resolution_notes: updateStatusModal.log.resolution_notes || '',
    })
  }, [updateStatusModal])

  async function submitStatus(e) {
    e.preventDefault()
    const log = updateStatusModal?.log
    if (!log) return
    setSubmitting(true)
    try {
      if (statusForm.repair_status === 'Resolved' && !statusForm.resolution_notes.trim()) {
        toast.error('Resolution notes are required when marking as Resolved.')
        return
      }
      await maintenanceAPI.updateLogStatus(log._id, {
        repair_status: statusForm.repair_status,
        resolution_notes: statusForm.resolution_notes.trim() || undefined,
      })
      toast.success(
        statusForm.repair_status === 'Resolved'
          ? '✅ Issue resolved. Asset restored to Working.'
          : 'Status updated.',
      )
      setUpdateStatusModal(null)
      await load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status')
    } finally {
      setSubmitting(false)
    }
  }

  const [assignTo, setAssignTo] = useState('')
  useEffect(() => {
    if (!assignModal?.log) return
    setAssignTo(assignModal.log.assigned_to?._id || '')
  }, [assignModal])

  async function submitAssign(e) {
    e.preventDefault()
    const log = assignModal?.log
    if (!log) return
    setSubmitting(true)
    try {
      await maintenanceAPI.updateLog(log._id, {
        assigned_to: assignTo || null,
      })
      toast.success('Assigned successfully.')
      setAssignModal(null)
      await load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ isOpen: false })}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Maintenance Logs</h1>
        {canWrite ? (
          <button type="button" className="btn btn-primary" onClick={() => setCreateModal(true)}>
            + Report Issue
          </button>
        ) : null}
      </div>

      <div className="filter-bar" style={{ marginTop: 14 }}>
        <select
          value={filters.repair_status}
          onChange={(e) => setFilters((p) => ({ ...p, repair_status: e.target.value }))}
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}
        >
          <option value="">All Priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <label style={{ fontSize: 12, color: 'var(--color-text-light)' }}>
          From:{' '}
          <input
            type="date"
            value={filters.from_date}
            onChange={(e) => setFilters((p) => ({ ...p, from_date: e.target.value }))}
          />
        </label>

        <label style={{ fontSize: 12, color: 'var(--color-text-light)' }}>
          To:{' '}
          <input
            type="date"
            value={filters.to_date}
            onChange={(e) => setFilters((p) => ({ ...p, to_date: e.target.value }))}
          />
        </label>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() =>
            setFilters({ repair_status: '', priority: '', from_date: '', to_date: '' })
          }
        >
          Clear
        </button>
      </div>

      <div style={{ marginBottom: 12, color: 'var(--color-text-light)' }}>
        Showing <strong>{filteredLogs.length}</strong> logs ·{' '}
        <span style={{ color: pendingCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
          🔴 {pendingCount} Pending
        </span>{' '}
        · 🟡 {inProgressCount} In Progress
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="card">
          {filteredLogs.length ? (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Issue Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Reported By</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log) => {
                      const asset = log?.asset_id
                      const isClosed = ['Resolved', 'Closed'].includes(log?.repair_status)
                      return (
                        <tr key={log._id}>
                          <td>
                            {asset?._id ? (
                              <Link to={`/assets/${asset._id}`} style={{ color: 'var(--color-primary-light)' }}>
                                {asset.asset_name || 'View asset'}
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>{log?.issue_title || '—'}</td>
                          <td>
                            <PriorityBadge priority={log?.priority} />
                          </td>
                          <td>
                            <StatusBadge status={log?.repair_status} />
                          </td>
                          <td>
                            {log?.assigned_to?.username ? (
                              log.assigned_to.username
                            ) : (
                              <span style={{ color: 'var(--color-text-light)' }}>Unassigned</span>
                            )}
                          </td>
                          <td>{log?.reported_by?.username || '—'}</td>
                          <td>
                            {log?.reported_at
                              ? new Date(log.reported_at).toLocaleDateString('en-IN')
                              : '—'}
                          </td>
                          <td>
                            <div className="icon-actions">
                              {asset?._id ? (
                                <button type="button" title="View" onClick={() => window.location.assign(`/assets/${asset._id}`)}>
                                  👁
                                </button>
                              ) : null}
                              {isAdmin && !isClosed ? (
                                <button
                                  type="button"
                                  title="Assign"
                                  onClick={() => setAssignModal({ log })}
                                >
                                  👷
                                </button>
                              ) : null}
                              {(isAdmin || isMaintenance) && !isClosed ? (
                                <button
                                  type="button"
                                  title="Update Status"
                                  onClick={() => setUpdateStatusModal({ log })}
                                >
                                  🔁
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
              No maintenance logs found.
            </div>
          )}
        </div>
      )}

      {createModal ? (
        <Modal title="Report Maintenance Issue" onClose={() => setCreateModal(false)}>
          <form onSubmit={submitCreate}>
            <div className="form-group">
              <label>Asset *</label>
              {loadingAssets ? (
                <Spinner size="sm" />
              ) : (
                <select
                  value={createForm.asset_id}
                  onChange={(e) => setCreateForm((p) => ({ ...p, asset_id: e.target.value }))}
                  required
                >
                  <option value="">Select asset...</option>
                  {assetsForSelect.map((a) => (
                    <option key={a._id} value={a._id}>
                      {(a.asset_code ? `${a.asset_code} - ` : '') + (a.asset_name || '')}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="form-group">
              <label>Issue Title *</label>
              <input
                className="form-control"
                value={createForm.issue_title}
                onChange={(e) => setCreateForm((p) => ({ ...p, issue_title: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Issue Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={createForm.issue_description}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, issue_description: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm((p) => ({ ...p, priority: e.target.value }))}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setCreateModal(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {updateStatusModal?.log ? (
        <Modal title="Update Maintenance Status" onClose={() => setUpdateStatusModal(null)}>
          <form onSubmit={submitStatus}>
            <div className="form-group">
              <label>Status *</label>
              <select
                value={statusForm.repair_status}
                onChange={(e) => setStatusForm((p) => ({ ...p, repair_status: e.target.value }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {statusForm.repair_status === 'Resolved' ? (
                <div className="form-error">
                  Resolution notes are required when marking as Resolved.
                </div>
              ) : null}
            </div>
            <div className="form-group">
              <label>Resolution Notes</label>
              <textarea
                className="form-control"
                rows={3}
                value={statusForm.resolution_notes}
                onChange={(e) => setStatusForm((p) => ({ ...p, resolution_notes: e.target.value }))}
                required={statusForm.repair_status === 'Resolved'}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setUpdateStatusModal(null)} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {assignModal?.log ? (
        <Modal title="Assign to Technician" onClose={() => setAssignModal(null)}>
          <form onSubmit={submitAssign}>
            <div className="form-group">
              <label>Assigned To</label>
              <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                <option value="">Unassigned</option>
                {maintenanceUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setAssignModal(null)} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  )
}

