import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { authApi } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      init: async () => {
        if (get().isInitialized) return
        const token = localStorage.getItem('token')
        if (token) {
          try {
            const { data } = await authApi.me()
            set({ user: data, token, isAuthenticated: true, isInitialized: true })
            return
          } catch {
            localStorage.removeItem('token')
          }
        }
        set({ user: null, token: null, isAuthenticated: false, isInitialized: true })
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.login({ email, password })
          localStorage.setItem('token', data.accessToken)
          set({ user: data.user, token: data.accessToken, isAuthenticated: true, isLoading: false, isInitialized: true })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.register({ email, password, name })
          localStorage.setItem('token', data.accessToken)
          set({ user: data.user, token: data.accessToken, isAuthenticated: true, isLoading: false, isInitialized: true })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false, isInitialized: true })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)