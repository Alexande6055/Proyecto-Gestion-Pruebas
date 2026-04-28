import { useEffect, useState } from 'react'
import './App.css'

// Types
import type { AuthSession, ViewKey, EntityState } from './types'

// Constants
import { 
  entityConfigs, 
  viewLabels, 
  managedViews, 
  initialEntityState 
} from './constants/entities'

// Services
import { requestJson, normalizeRows } from './services/api'

// Components
import { Badge } from './components/common/Badge'

// Pages
import { AuthView } from './pages/Auth/AuthView'
import { DashboardView } from './pages/Dashboard/DashboardView'
import { EntityView } from './pages/Entity/EntityView'

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const storedSession = localStorage.getItem('uride-session')
      return storedSession ? JSON.parse(storedSession) as AuthSession : null
    } catch {
      return null
    }
  })
  
  const [activeView, setActiveView] = useState<ViewKey>('dashboard')
  const [search, setSearch] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  
  const [data, setData] = useState<Record<ViewKey, EntityState>>({
    dashboard: { rows: [], loading: false, error: '' },
    users: initialEntityState,
    trips: initialEntityState,
    requests: initialEntityState,
    ratings: initialEntityState,
    reports: initialEntityState,
    audit_logs: initialEntityState,
  })

  useEffect(() => {
    if (!session) return

    let cancelled = false

    async function loadData() {
      setBackendStatus('checking')

      try {
        await requestJson<unknown>('/api')
      } catch {
        if (cancelled) return
        setBackendStatus('offline')
        setData((current) => {
          const next = { ...current }
          managedViews.forEach((key) => {
            next[key] = {
              rows: [],
              loading: false,
              error: 'Backend no disponible en http://localhost:3000',
            }
          })
          return next
        })
        return
      }

      if (cancelled) return
      setBackendStatus('online')

      await Promise.all(managedViews.map(async (key) => {
        const config = entityConfigs[key]
        setData((current) => ({
          ...current,
          [key]: { ...current[key], loading: true, error: '' },
        }))

        try {
          const payload = await requestJson<unknown>(config.endpoint)
          if (cancelled) return
          setData((current) => ({
            ...current,
            [key]: { rows: normalizeRows(payload), loading: false, error: '' },
          }))
        } catch (error) {
          if (cancelled) return
          setData((current) => ({
            ...current,
            [key]: {
              rows: [],
              loading: false,
              error: error instanceof Error ? error.message : 'Error desconocido',
            },
          }))
        }
      }))
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [refreshToken, session])

  const handleLogout = async () => {
    try {
      await requestJson('/api/auth/logout', { method: 'POST' })
    } finally {
      localStorage.removeItem('uride-session')
      setSession(null)
      setSearch('')
      setActiveView('dashboard')
    }
  }

  if (!session) {
    return <AuthView onAuthenticated={setSession} />
  }

  const currentView = activeView === 'dashboard'
    ? <DashboardView data={data} />
    : (
      <EntityView
        config={entityConfigs[activeView]}
        state={data[activeView]}
        data={data}
        search={search}
        onCreated={() => setRefreshToken((value) => value + 1)}
      />
    )

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>UR</span>
          <div>
            <strong>U-Ride</strong>
            <small>Gestion de viajes</small>
          </div>
        </div>
        <nav aria-label="Vistas del sistema">
          {(Object.keys(viewLabels) as ViewKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={activeView === key ? 'active' : ''}
              onClick={() => setActiveView(key)}
            >
              <span>{viewLabels[key].slice(0, 2)}</span>
              {viewLabels[key]}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span>Vista actual</span>
            <strong>{viewLabels[activeView]}</strong>
          </div>
          <Badge tone={backendStatus === 'online' ? 'ok' : backendStatus === 'checking' ? 'info' : 'danger'}>
            {backendStatus === 'online' ? 'backend online' : backendStatus === 'checking' ? 'verificando backend' : 'backend offline'}
          </Badge>
          <div className="session-box">
            <span>{session.user.nombre}</span>
            <button type="button" className="secondary" onClick={handleLogout}>Salir</button>
          </div>
          <div className="search-box">
            <input
              aria-label="Buscar"
              placeholder="Buscar por atributo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </header>
        {currentView}
      </section>
    </main>
  )
}

export default App
