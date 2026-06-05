import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { AuthSession, NotificationItem, ViewKey } from '../../types'

interface MainLayoutProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
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
  isMobile,
  toggleSidebar,
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
    <div className="h-screen min-h-screen bg-night-50 flex overflow-hidden relative">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        isMobile={isMobile}
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
          isMobile={isMobile}
          toggleSidebar={toggleSidebar}
        />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </section>

      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
