import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuth from '../hooks/useAuth'

function EyeIcon({ open }) {
  return (
    <span aria-hidden="true" style={{ fontSize: 14 }}>
      {open ? '🙈' : '👁'}
    </span>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !isSubmitting
  }, [email, password, isSubmitting])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(email.trim(), password)
      toast.success('Logged in successfully')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid credentials'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="full-page-center"
      style={{ backgroundColor: 'var(--color-primary)', padding: 16 }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          padding: 40,
          border: 'none',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 0.02 }}>
            LCAMS
          </div>
          <div style={{ color: 'var(--color-text-light)', marginTop: 6 }}>
            Classroom & Asset Management System
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="form-control"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lcams.edu"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                className="form-control"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {error ? (
            <div className="form-error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 6 }}
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

