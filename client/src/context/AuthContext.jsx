import { createContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe as getMeAPI, login as loginAPI } from '../api/authAPI'

export const AuthContext = createContext(null)

function safeParseJSON(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function init() {
      const storedToken = window.localStorage.getItem('lcams_token')
      const storedUser = safeParseJSON(window.localStorage.getItem('lcams_user'))

      if (isMounted) {
        setToken(storedToken || null)
        setUser(storedUser || null)
      }

      if (!storedToken) {
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        const data = await getMeAPI()
        const me = data?.user ?? data
        window.localStorage.setItem('lcams_user', JSON.stringify(me))
        if (isMounted) setUser(me)
      } catch (err) {
        if (err?.response?.status === 401) {
          window.localStorage.removeItem('lcams_token')
          window.localStorage.removeItem('lcams_user')
          if (isMounted) {
            setToken(null)
            setUser(null)
          }
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [])

  async function login(email, password) {
    const data = await loginAPI(email, password)
    const nextToken = data?.token
    const nextUser = data?.user

    window.localStorage.setItem('lcams_token', nextToken)
    window.localStorage.setItem('lcams_user', JSON.stringify(nextUser))

    setToken(nextToken)
    setUser(nextUser)

    return data
  }

  function logout() {
    window.localStorage.removeItem('lcams_token')
    window.localStorage.removeItem('lcams_user')
    setToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }

const roleName = user?.role?.role_name

const helpers = useMemo(() => {
  const isAdmin = roleName === 'Admin'
  const isStaff = roleName === 'Staff'
  const isMaintenance = roleName === 'Maintenance'
  const isViewer = roleName === 'Viewer'
  const canWrite = isAdmin || isStaff
  const canManageStructure = isAdmin

  return {
    isAdmin,
    isStaff,
    isMaintenance,
    isViewer,
    canWrite,
    canManageStructure,
  }
}, [roleName])

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
      ...helpers,
    }),
    [user, token, isLoading, helpers],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

