import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { AuthSession, NotificationItem, ViewKey } from '../../types'

interface MainLayoutProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  visibleViews: ViewKey[]
  activeView: ViewKey
  backendStatus: 'checking' | 'online' | 'offline'
  search: string
  setSearch: (value: string) => void
  session: AuthSession
  notifications: NotificationItem[]
  onNotificationsAction: () => void
  handleLogout: () => void
}

export function MainLayout({
  sidebarOpen,
  setSidebarOpen,
  visibleViews,
  activeView,
  backendStatus,
  search,
  setSearch,
  session,
  notifications,
  onNotificationsAction,
  handleLogout,
}: MainLayoutProps) {
  return (
    <div className="h-screen min-h-screen bg-night-50 flex overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        visibleViews={visibleViews} 
      />

      <section className="flex-1 flex flex-col min-h-0 min-w-0 bg-night-50">
        <Header 
          activeView={activeView}
          backendStatus={backendStatus}
          search={search}
          setSearch={setSearch}
          session={session}
          notifications={notifications}
          onNotificationsAction={onNotificationsAction}
          handleLogout={handleLogout}
        />

        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          <Outlet />
        </main>
      </section>
    </div>
  )
}
