import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import axiosInstance from '../api/axiosInstance'
import useAuth from '../hooks/useAuth'

function RoleBadge({ role }) {
  const roleName = role || '—'
  const styles = {
    Admin: { background: '#1E3A5F', color: 'white' },
    Staff: { background: '#2C5F8A', color: 'white' },
    Maintenance: { background: '#E8A020', color: 'white' },
    Viewer: { background: '#BDC3C7', color: '#333' },
  }
  const s = styles[roleName] || { background: '#ccc', color: '#333' }
  return (
    <span
      style={{
        ...s,
        padding: '2px 10px',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {roleName}
    </span>
  )
}

function EyeIcon({ open }) {
  return <span aria-hidden="true">{open ? '🙈' : '👁'}</span>
}

export default function Profile() {
  const { user, logout } = useAuth()

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState({
    current: false,
    next: false,
    confirm: false,
  })

  const memberSince = useMemo(() => {
    const d = user?.created_at || user?.createdAt
    return d ? new Date(d).toLocaleDateString('en-IN') : '—'
  }, [user])

  async function submitPassword(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    const { current_password, new_password, confirm_password } = passwordForm
    if (new_password !== confirm_password) {
      setPasswordError('New passwords do not match.')
      return
    }
    if ((new_password || '').length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      await axiosInstance.put(`/users/${user._id}`, { current_password, new_password })
      setPasswordSuccess(true)
      toast.success('Password updated successfully.')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      setTimeout(() => setPasswordSuccess(false), 4000)
    } catch (err) {
      setPasswordError(err?.response?.data?.message || 'Update failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="card">
        <div style={{ fontWeight: 800 }}>No user loaded.</div>
        <button type="button" className="btn btn-secondary" onClick={logout} style={{ marginTop: 12 }}>
          Go to login
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>My Profile</h1>

      <div className="card" style={{ maxWidth: 500, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{user?.username}</h2>
            <p style={{ color: 'var(--color-text-light)', margin: 0 }}>{user?.email}</p>
          </div>
        </div>

        <div className="info-grid" style={{ margin: 0 }}>
          <div className="info-row">
            <label>Department</label>
            <span>{user?.department || '—'}</span>
          </div>
          <div className="info-row">
            <label>Role</label>
            <span>
              <RoleBadge role={user?.role_id?.role_name} />
            </span>
          </div>
          <div className="info-row">
            <label>Account Status</label>
            <span style={{ color: user?.is_active ? '#27AE60' : '#C0392B', fontWeight: 700 }}>
              {user?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="info-row">
            <label>Member Since</label>
            <span>{memberSince}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 500 }}>
        <h2 style={{ marginTop: 0 }}>Change Password</h2>

        {passwordSuccess ? (
          <div
            style={{
              background: '#D5F5E3',
              border: '1px solid #27AE60',
              color: '#1E8449',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            ✅ Password updated successfully.
          </div>
        ) : null}

        {passwordError ? (
          <div
            style={{
              background: '#FADBD8',
              border: '1px solid #C0392B',
              color: '#C0392B',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            {passwordError}
          </div>
        ) : null}

        <form onSubmit={submitPassword}>
          <div className="form-group">
            <label>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass.current ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, current_password: e.target.value }))
                }
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => ({ ...p, current: !p.current }))}
                aria-label={showPass.current ? 'Hide password' : 'Show password'}
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
                <EyeIcon open={showPass.current} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass.next ? 'text' : 'password'}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => ({ ...p, next: !p.next }))}
                aria-label={showPass.next ? 'Hide password' : 'Show password'}
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
                <EyeIcon open={showPass.next} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass.confirm ? 'text' : 'password'}
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, confirm_password: e.target.value }))
                }
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))}
                aria-label={showPass.confirm ? 'Hide password' : 'Show password'}
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
                <EyeIcon open={showPass.confirm} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

