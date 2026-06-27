import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axiosInstance from '../api/axiosInstance'
import * as authAPI from '../api/authAPI'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Spinner from '../components/common/Spinner'
import useAuth from '../hooks/useAuth'

const roleBadgeColor = {
  Admin: { bg: '#1E3A5F', color: 'white' },
  Staff: { bg: '#2C5F8A', color: 'white' },
  Maintenance: { bg: '#E8A020', color: 'white' },
  Viewer: { bg: '#BDC3C7', color: '#333' },
}

function unpackList(res) {
  const v = res?.data?.data ?? res?.data ?? res
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

function EyeIcon({ open }) {
  return <span aria-hidden="true">{open ? '🙈' : '👁'}</span>
}

export default function Users() {
  const navigate = useNavigate()
  const { isAdmin, user: currentUser } = useAuth()

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [deactivateConfirm, setDeactivateConfirm] = useState({ isOpen: false })

  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    password: '',
    department: '',
    role_id: '',
  })

  async function reloadUsers() {
    const res = await axiosInstance.get('/users')
    setUsers(unpackList(res))
  }

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true })
      return
    }

    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [uRes, rRes] = await Promise.all([
          axiosInstance.get('/users'),
          axiosInstance.get('/roles'),
        ])
        if (!mounted) return
        setUsers(unpackList(uRes))
        setRoles(unpackList(rRes))
      } catch (err) {
        const msg = err?.response?.data?.message || 'Failed to load users'
        if (mounted) setError(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [isAdmin, navigate])

  const currentId = currentUser?._id

  const canDeactivate = useMemo(() => {
    return (u) => u?.is_active === true && u?._id && u._id !== currentId
  }, [currentId])

  function handleDeactivate(u) {
    setDeactivateConfirm({
      isOpen: true,
      title: 'Deactivate User',
      message: `Deactivate ${u.username}? They will lose access immediately.`,
      onConfirm: async () => {
        setDeactivateConfirm({ isOpen: false })
        try {
          await axiosInstance.put(`/users/${u._id}`, { is_active: false })
          toast.success('User deactivated.')
          await reloadUsers()
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Failed to deactivate user')
        }
      },
    })
  }

  async function submitAdd(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      if (!addForm.username.trim() || !addForm.email.trim() || !addForm.password || !addForm.role_id) {
        setFormError('Please fill all required fields.')
        return
      }
      await authAPI.register({
        username: addForm.username.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        department: addForm.department.trim() || undefined,
        role_id: addForm.role_id,
      })
      toast.success('User created.')
      await reloadUsers()
      setAddModal(false)
      setAddForm({ username: '', email: '', password: '', department: '', role_id: '' })
      setShowPass(false)
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Error creating user.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAdmin) return null

  return (
    <>
      <ConfirmDialog
        isOpen={deactivateConfirm.isOpen}
        title={deactivateConfirm.title}
        message={deactivateConfirm.message}
        onConfirm={deactivateConfirm.onConfirm}
        onCancel={() => setDeactivateConfirm({ isOpen: false })}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>User Management</h1>
        <button type="button" className="btn btn-primary" onClick={() => setAddModal(true)}>
          + Add User
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
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleName = u?.role_id?.role_name
                  const rc = roleBadgeColor[roleName] || { bg: '#ccc', color: '#333' }
                  return (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 700 }}>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.department || '—'}</td>
                      <td>
                        <span
                          style={{
                            background: rc.bg,
                            color: rc.color,
                            padding: '2px 10px',
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'inline-block',
                          }}
                        >
                          {roleName || '—'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: u.is_active ? '#27AE60' : '#C0392B',
                            fontWeight: 600,
                          }}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {canDeactivate(u) ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeactivate(u)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <span style={{ color: 'var(--color-text-light)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addModal ? (
        <Modal title="Add New User" onClose={() => setAddModal(false)}>
          <form onSubmit={submitAdd}>
            <div className="form-group">
              <label>Username *</label>
              <input
                className="form-control"
                value={addForm.username}
                onChange={(e) => setAddForm((p) => ({ ...p, username: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                className="form-control"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showPass ? 'text' : 'password'}
                  value={addForm.password}
                  onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    background: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                className="form-control"
                value={addForm.department}
                onChange={(e) => setAddForm((p) => ({ ...p, department: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select
                value={addForm.role_id}
                onChange={(e) => setAddForm((p) => ({ ...p, role_id: e.target.value }))}
                required
              >
                <option value="">Select role...</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>

            {formError ? (
              <div className="form-error" style={{ marginTop: -6 }}>
                {formError}
              </div>
            ) : null}

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setAddModal(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  )
}

