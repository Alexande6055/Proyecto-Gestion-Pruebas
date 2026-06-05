import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  isMobile: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setIsMobile: (isMobile: boolean) => void
  search: string
  setSearch: (search: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: window.innerWidth >= 1024,
  isMobile: window.innerWidth < 1024,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setIsMobile: (isMobile) => set({ isMobile }),
  search: '',
  setSearch: (search) => set({ search }),
}))
