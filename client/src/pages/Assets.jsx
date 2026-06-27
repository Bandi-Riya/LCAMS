import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as assetAPI from '../api/assetAPI'
import * as blockAPI from '../api/blockAPI'
import * as roomAPI from '../api/roomAPI'
import StatusBadge from '../components/common/StatusBadge'
import Spinner from '../components/common/Spinner'
import Pagination from '../components/common/Pagination'
import ConfirmDialog from '../components/common/ConfirmDialog'
import useAuth from '../hooks/useAuth'
import useDebounce from '../hooks/useDebounce'

const ITEMS_PER_PAGE = 10
const STATUSES = ['Working', 'Damaged', 'Under Maintenance', 'Discarded', 'Lost']
const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Laboratory Equipment',
  'Electrical',
  'IT Infrastructure',
  'Safety Equipment',
  'Other',
]

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

function roomOptionLabel(r) {
  const block = r?.floor_id?.block_id?.block_name
  const floor = r?.floor_id?.floor_label
  const roomNo = r?.room_number
  return `${block || '—'} > ${floor || '—'} > ${roomNo || '—'}`
}

function AssetFormModal({ asset, onClose, onSuccess }) {
  const isEdit = !!asset
  const [submitting, setSubmitting] = useState(false)
  const [allRooms, setAllRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)

  const [formData, setFormData] = useState({
    asset_name: asset?.asset_name || '',
    asset_code: asset?.asset_code || '',
    category: asset?.category || 'Electronics',
    brand: asset?.brand || '',
    model_number: asset?.model_number || '',
    serial_number: asset?.serial_number || '',
    purchase_date: asset?.purchase_date ? String(asset.purchase_date).slice(0, 10) : '',
    purchase_cost: asset?.purchase_cost ?? '',
    warranty_expiry: asset?.warranty_expiry ? String(asset.warranty_expiry).slice(0, 10) : '',
    room_id: asset?.room_id?._id || asset?.room_id || '',
  })

  useEffect(() => {
    let mounted = true
    async function loadRooms() {
      setLoadingRooms(true)
      try {
        const res = await roomAPI.getRooms()
        if (mounted) setAllRooms(unpackList(res))
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load rooms')
      } finally {
        if (mounted) setLoadingRooms(false)
      }
    }
    loadRooms()
    return () => {
      mounted = false
    }
  }, [])

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (
        !formData.asset_name.trim() ||
        !formData.asset_code.trim() ||
        !formData.category ||
        !formData.room_id
      ) {
        toast.error('Please fill all required fields')
        return
      }

      const payload = {
        asset_name: formData.asset_name.trim(),
        asset_code: formData.asset_code.trim(),
        category: formData.category,
        brand: formData.brand.trim() || undefined,
        model_number: formData.model_number.trim() || undefined,
        serial_number: formData.serial_number.trim() || undefined,
        purchase_date: formData.purchase_date || undefined,
        purchase_cost: formData.purchase_cost === '' ? undefined : Number(formData.purchase_cost),
        warranty_expiry: formData.warranty_expiry || undefined,
        room_id: formData.room_id,
      }

      if (isEdit) {
        await assetAPI.updateAsset(asset._id, payload)
        toast.success('Asset updated')
      } else {
        await assetAPI.createAsset(payload)
        toast.success('Asset created')
      }

      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save asset')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-group">
        <label>Asset Name *</label>
        <input
          className="form-control"
          value={formData.asset_name}
          onChange={(e) => setFormData((p) => ({ ...p, asset_name: e.target.value }))}
          required
        />
      </div>
      <div className="form-group">
        <label>Asset Code *</label>
        <input
          className="form-control"
          value={formData.asset_code}
          onChange={(e) => setFormData((p) => ({ ...p, asset_code: e.target.value }))}
          required
        />
      </div>
      <div className="form-group">
        <label>Category *</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Room *</label>
        {loadingRooms ? (
          <Spinner size="sm" />
        ) : (
          <select
            value={formData.room_id}
            onChange={(e) => setFormData((p) => ({ ...p, room_id: e.target.value }))}
            required
          >
            <option value="">Select room...</option>
            {allRooms.map((r) => (
              <option key={r._id} value={r._id}>
                {roomOptionLabel(r)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="form-group">
        <label>Brand</label>
        <input
          className="form-control"
          value={formData.brand}
          onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label>Model Number</label>
        <input
          className="form-control"
          value={formData.model_number}
          onChange={(e) => setFormData((p) => ({ ...p, model_number: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label>Serial Number</label>
        <input
          className="form-control"
          value={formData.serial_number}
          onChange={(e) => setFormData((p) => ({ ...p, serial_number: e.target.value }))}
        />
      </div>

      <div className="form-group">
        <label>Purchase Date</label>
        <input
          className="form-control"
          type="date"
          value={formData.purchase_date}
          onChange={(e) => setFormData((p) => ({ ...p, purchase_date: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label>Purchase Cost</label>
        <input
          className="form-control"
          type="number"
          value={formData.purchase_cost}
          onChange={(e) => setFormData((p) => ({ ...p, purchase_cost: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label>Warranty Expiry</label>
        <input
          className="form-control"
          type="date"
          value={formData.warranty_expiry}
          onChange={(e) => setFormData((p) => ({ ...p, warranty_expiry: e.target.value }))}
        />
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function Assets() {
  const navigate = useNavigate()
  const { canWrite, isAdmin } = useAuth()

  const [allAssets, setAllAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [blocks, setBlocks] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    block_id: '',
  })
  const debouncedSearch = useDebounce(filters.search, 300)

  const [currentPage, setCurrentPage] = useState(1)
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    asset: null,
    onConfirm: null,
  })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [aRes, bRes] = await Promise.all([assetAPI.getAssets(), blockAPI.getBlocks()])
      const list = aRes?.data?.data || aRes?.data || aRes || []
      const blockList = bRes?.data?.data || bRes?.data || bRes || []
      setAllAssets(Array.isArray(list) ? list : [])
      setBlocks(Array.isArray(blockList) ? blockList : [])
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load assets'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredAssets = useMemo(() => {
    if (!allAssets || !Array.isArray(allAssets)) return []
    const s = (debouncedSearch || '').trim().toLowerCase()

    return (allAssets || []).filter((a) => {
      const name = (a?.asset_name || '').toLowerCase()
      const code = (a?.asset_code || '').toLowerCase()

      if (s && !(name.includes(s) || code.includes(s))) return false
      if (filters.status && a?.status !== filters.status) return false
      if (filters.category && a?.category !== filters.category) return false
      if (filters.block_id) {
        const bid = a?.room_id?.floor_id?.block_id?._id
        if (bid !== filters.block_id) return false
      }
      return true
    })
  }, [allAssets, debouncedSearch, filters.status, filters.category, filters.block_id])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, filters.status, filters.category, filters.block_id])

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / ITEMS_PER_PAGE))
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAssets.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAssets, currentPage])

  async function handleDelete(asset) {
    setDeleteConfirm({
      isOpen: true,
      asset,
      onConfirm: async () => {
        setDeleteConfirm({ isOpen: false, asset: null })
        try {
          await assetAPI.deleteAsset(asset._id)
          toast.success('Asset deleted')
          await load()
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Failed to delete asset')
        }
      },
    })
  }

  return (
    <>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Asset?"
        message="Are you sure you want to delete this asset?"
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, asset: null })}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Asset Inventory</h1>
        {canWrite ? (
          <button type="button" className="btn btn-primary" onClick={() => setAddModal(true)}>
            + Add Asset
          </button>
        ) : null}
      </div>

      <div className="filter-bar" style={{ marginTop: 14 }}>
        <input
          className="form-control"
          placeholder="Search by name or code..."
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
        />

        <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={filters.block_id} onChange={(e) => setFilters((p) => ({ ...p, block_id: e.target.value }))}>
          <option value="">All Blocks</option>
          {blocks.map((b) => (
            <option key={b._id} value={b._id}>
              {b.block_name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setFilters({ search: '', status: '', category: '', block_id: '' })}
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="card" style={{ marginTop: 16, color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : (
        <div className="card" style={{ marginTop: 16 }}>
          {filteredAssets.length ? (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Asset Code</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Room</th>
                      <th>Floor</th>
                      <th>Block</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssets.map((a) => (
                      <tr key={a._id}>
                        <td style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>
                          {a.asset_code}
                        </td>
                        <td style={{ fontWeight: 800 }}>{a.asset_name}</td>
                        <td>{a.category || '—'}</td>
                        <td>
                          <StatusBadge status={a.status} />
                        </td>
                        <td>{a?.room_id?.room_number || a?.room_id?.room_name || '—'}</td>
                        <td>{a?.room_id?.floor_id?.floor_label || '—'}</td>
                        <td>{a?.room_id?.floor_id?.block_id?.block_name || '—'}</td>
                        <td>
                          <div className="icon-actions">
                            <button type="button" title="View" onClick={() => navigate(`/assets/${a._id}`)}>
                              👁
                            </button>
                            {canWrite ? (
                              <button type="button" title="Edit" onClick={() => setEditModal(a)}>
                                ✏️
                              </button>
                            ) : null}
                            {isAdmin ? (
                              <button type="button" title="Delete" onClick={() => handleDelete(a)}>
                                🗑
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
              No assets found.
            </div>
          )}
        </div>
      )}

      {addModal ? (
        <Modal title="Add Asset" onClose={() => setAddModal(false)}>
          <AssetFormModal asset={null} onClose={() => setAddModal(false)} onSuccess={load} />
        </Modal>
      ) : null}

      {editModal ? (
        <Modal title="Edit Asset" onClose={() => setEditModal(null)}>
          <AssetFormModal asset={editModal} onClose={() => setEditModal(null)} onSuccess={load} />
        </Modal>
      ) : null}
    </>
  )
}

