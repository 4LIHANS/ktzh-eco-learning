import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, homePath, type ApiUser, type UserRole } from '../api/client'

interface AuthState {
  user: ApiUser | null
  isAuthenticated: boolean
  role: UserRole | null
  loading: boolean
  login: (login: string, password: string) => Promise<UserRole>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await api.me()
      setUser(me)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const login = useCallback(async (loginName: string, password: string) => {
    const { user: loggedIn } = await api.login(loginName, password)
    setUser(loggedIn)
    return loggedIn.role
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: !!user,
      role: user?.role ?? null,
      loading,
      login,
      logout,
      refresh,
    }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { homePath }
