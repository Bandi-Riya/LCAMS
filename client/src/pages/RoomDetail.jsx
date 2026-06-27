import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as roomAPI from '../api/roomAPI'
import * as assetAPI from '../api/assetAPI'
import StatusBadge from '../components/common/StatusBadge'
import Spinner from '../components/common/Spinner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import useAuth from '../hooks/useAuth'

function unpack(res) {
  return res?.data?.data ?? res?.data ?? res
}

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
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
            }}
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

function AssetForm({ roomId, roomLabel, onClose, onCreated }) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_code: '',
    category: 'Electronics',
    brand: '',
    model_number: '',
    serial_number: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
  })

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (!formData.asset_name.trim() || !formData.asset_code.trim() || !formData.category) {
        toast.error('Please fill all required fields')
        return
      }

      const payload = {
        ...formData,
        asset_name: formData.asset_name.trim(),
        asset_code: formData.asset_code.trim(),
        brand: formData.brand.trim() || undefined,
        model_number: formData.model_number.trim() || undefined,
        serial_number: formData.serial_number.trim() || undefined,
        purchase_date: formData.purchase_date || undefined,
        purchase_cost: formData.purchase_cost === '' ? undefined : Number(formData.purchase_cost),
        warranty_expiry: formData.warranty_expiry || undefined,
        room_id: roomId,
      }

      await assetAPI.createAsset(payload)
      toast.success('Asset added')
      onCreated?.()
      onClose?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add asset')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-group">
        <label>Room</label>
        <input className="form-control" value={roomLabel} disabled />
      </div>

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
        <label>Brand</label>
        <input
          className="form-control"
          value={formData.brand}
          onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
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

export default function RoomDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canWrite, isAdmin } = useAuth()

  const [room, setRoom] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [addAssetModal, setAddAssetModal] = useState(false)
  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [rRes, aRes] = await Promise.all([
        roomAPI.getRoomById(id),
        roomAPI.getRoomAssets(id),
      ])
      setRoom(rRes?.data?.data || rRes?.data || rRes)
      const assetList = aRes?.data?.data || aRes?.data || aRes || []
      setAssets(Array.isArray(assetList) ? assetList : [])
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load room'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const filteredAssets = useMemo(() => {
    return (assets || []).filter((a) => {
      if (filterStatus && a?.status !== filterStatus) return false
      if (filterCategory && a?.category !== filterCategory) return false
      return true
    })
  }, [assets, filterStatus, filterCategory])

  if (loading) return <Spinner fullPage />

  if (error) {
    return (
      <div className="card">
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
          Room Details
        </div>
        <div style={{ color: 'var(--color-danger)', marginBottom: 14 }}>{error}</div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    )
  }

  const blockName = room?.floor_id?.block_id?.block_name
  const floorLabel = room?.floor_id?.floor_label
  const roomLabel = `${blockName || '—'} > ${floorLabel || '—'} > ${room?.room_number || '—'}`

  return (
    <>
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ isOpen: false })}
      />

      <div className="breadcrumb">
        <Link to="/infrastructure">Infrastructure</Link> <span>›</span> {blockName || '—'}{' '}
        <span>›</span> {floorLabel || '—'} <span>›</span> {room?.room_number || '—'}
      </div>

      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{room?.room_name || room?.room_number}</h2>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="chip">{room?.room_number || '—'}</span>
            {room?.room_type ? <span className="chip">{room.room_type}</span> : null}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="chip">{`Seating: ${room?.seating_capacity ?? '—'}`}</span>
          <span className={`chip ${room?.has_projector ? 'chip-green' : 'chip-gray'}`}>
            📽️ Projector: {room?.has_projector ? 'Yes' : 'No'}
          </span>
          <span className={`chip ${room?.has_ac ? 'chip-green' : 'chip-gray'}`}>
            ❄️ AC: {room?.has_ac ? 'Yes' : 'No'}
          </span>
          {isAdmin ? (
            <>
              <button type="button" className="btn btn-secondary" disabled>
                Edit
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled
                title="Delete is available in Infrastructure page"
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 10,
        }}
      >
        <h3 style={{ margin: 0 }}>Assets ({filteredAssets.length})</h3>
        {canWrite ? (
          <button type="button" className="btn btn-primary" onClick={() => setAddAssetModal(true)}>
            + Add Asset
          </button>
        ) : null}
      </div>

      <div className="filter-bar">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {(filterStatus || filterCategory) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setFilterStatus('')
              setFilterCategory('')
            }}
          >
            Clear
          </button>
        )}
      </div>

      {filteredAssets.length ? (
        <div className="asset-grid">
          {filteredAssets.map((asset) => (
            <div
              key={asset._id}
              className="asset-card"
              onClick={() => navigate(`/assets/${asset._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 800 }}>{asset.asset_name}</div>
                {asset.category ? <span className="chip chip-sm">{asset.category}</span> : null}
              </div>
              <div style={{ marginTop: 10 }}>
                <StatusBadge status={asset.status} />
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
      ) : (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📦</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {assets?.length
              ? 'No assets match the current filters.'
              : 'No assets in this room yet.'}
          </div>
        </div>
      )}

      {addAssetModal ? (
        <Modal title="Add Asset" onClose={() => setAddAssetModal(false)}>
          <AssetForm
            roomId={id}
            roomLabel={roomLabel}
            onClose={() => setAddAssetModal(false)}
            onCreated={load}
          />
        </Modal>
      ) : null}
    </>
  )
}

