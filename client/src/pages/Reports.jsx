import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import * as blockAPI from '../api/blockAPI'
import axiosInstance from '../api/axiosInstance'

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
const MAINT_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

function pickParams(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== ''))
}

async function download(url, params, filename) {
  const res = await axiosInstance.get(url, { params, responseType: 'blob' })
  const blob = new Blob([res.data], { type: res.headers['content-type'] })
  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(blobUrl)
}

export default function Reports() {
  const [blocks, setBlocks] = useState([])
  const [assetFilters, setAssetFilters] = useState({
    block_id: '',
    status: '',
    category: '',
    from_date: '',
    to_date: '',
  })
  const [maintFilters, setMaintFilters] = useState({
    repair_status: '',
    priority: '',
    from_date: '',
    to_date: '',
  })
  const [downloading, setDownloading] = useState({
    assetPdf: false,
    assetExcel: false,
    maintPdf: false,
    maintExcel: false,
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await blockAPI.getBlocks()
        const list = res?.data?.data ?? res?.data ?? res
        if (mounted) setBlocks(Array.isArray(list) ? list : [])
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load blocks')
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  async function handleDownload(type) {
    setDownloading((p) => ({ ...p, [type]: true }))
    try {
      const now = new Date().toISOString().slice(0, 10)

      if (type === 'assetPdf') {
        await download(
          '/reports/assets/pdf',
          pickParams(assetFilters),
          `asset-report-${now}.pdf`,
        )
      }
      if (type === 'assetExcel') {
        await download(
          '/reports/assets/excel',
          pickParams(assetFilters),
          `asset-report-${now}.xlsx`,
        )
      }
      if (type === 'maintPdf') {
        await download(
          '/reports/maintenance/pdf',
          pickParams(maintFilters),
          `maintenance-report-${now}.pdf`,
        )
      }
      if (type === 'maintExcel') {
        await download(
          '/reports/maintenance/excel',
          pickParams(maintFilters),
          `maintenance-report-${now}.xlsx`,
        )
      }

      toast.success('Download started.')
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setDownloading((p) => ({ ...p, [type]: false }))
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Reports & Exports</h1>
      <div style={{ color: 'var(--color-text-light)', marginBottom: 16 }}>
        Generate PDF/Excel exports for assets and maintenance activity.
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
            📦 Asset Inventory Report
          </div>
          <div style={{ color: 'var(--color-text-light)', marginBottom: 14 }}>
            Export complete asset list with condition and location data.
          </div>

          <div className="form-group">
            <label>Block</label>
            <select
              value={assetFilters.block_id}
              onChange={(e) => setAssetFilters((p) => ({ ...p, block_id: e.target.value }))}
            >
              <option value="">All Blocks</option>
              {blocks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.block_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={assetFilters.status}
              onChange={(e) => setAssetFilters((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={assetFilters.category}
              onChange={(e) => setAssetFilters((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>From</label>
              <input
                type="date"
                value={assetFilters.from_date}
                onChange={(e) => setAssetFilters((p) => ({ ...p, from_date: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>To</label>
              <input
                type="date"
                value={assetFilters.to_date}
                onChange={(e) => setAssetFilters((p) => ({ ...p, to_date: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={downloading.assetPdf}
              onClick={() => handleDownload('assetPdf')}
            >
              {downloading.assetPdf ? 'Generating...' : '📄 Export PDF'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={downloading.assetExcel}
              onClick={() => handleDownload('assetExcel')}
            >
              {downloading.assetExcel ? 'Generating...' : '📊 Export Excel'}
            </button>
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
            🔧 Maintenance Log Report
          </div>
          <div style={{ color: 'var(--color-text-light)', marginBottom: 14 }}>
            Export maintenance history with resolution details and timelines.
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={maintFilters.repair_status}
              onChange={(e) => setMaintFilters((p) => ({ ...p, repair_status: e.target.value }))}
            >
              <option value="">All Status</option>
              {MAINT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              value={maintFilters.priority}
              onChange={(e) => setMaintFilters((p) => ({ ...p, priority: e.target.value }))}
            >
              <option value="">All Priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>From</label>
              <input
                type="date"
                value={maintFilters.from_date}
                onChange={(e) => setMaintFilters((p) => ({ ...p, from_date: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>To</label>
              <input
                type="date"
                value={maintFilters.to_date}
                onChange={(e) => setMaintFilters((p) => ({ ...p, to_date: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={downloading.maintPdf}
              onClick={() => handleDownload('maintPdf')}
            >
              {downloading.maintPdf ? 'Generating...' : '📄 Export PDF'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={downloading.maintExcel}
              onClick={() => handleDownload('maintExcel')}
            >
              {downloading.maintExcel ? 'Generating...' : '📊 Export Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

