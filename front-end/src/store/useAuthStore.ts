import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession } from '../types'
import { authService } from '../services'

interface AuthState {
  session: AuthSession | null
  setSession: (session: AuthSession | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      logout: async () => {
        try {
          await authService.logout()
        } finally {
          authService.clearSession()
          set({ session: null })
        }
      },
    }),
    {
      name: 'uride-session-storage',
      partialize: (state) => ({ session: state.session }),
    }
  )
)
