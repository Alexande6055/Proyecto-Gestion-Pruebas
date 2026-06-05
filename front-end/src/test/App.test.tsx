import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

let mockSession: any = null

const mockSetSession = vi.fn((session) => {
    mockSession = session
})

const mockLogout = vi.fn()
const mockSetSidebarOpen = vi.fn()
const mockSetIsMobile = vi.fn()
const mockToggleSidebar = vi.fn()
const mockSetSearch = vi.fn()
const mockNavigateTrips = vi.fn()

const adminSession = {
    access_token: 'token-admin',
    user: {
        id: 1,
        nombre: 'Admin Test',
        email: 'admin@test.com',
        role: 'admin',
    },
}

const userSession = {
    access_token: 'token-user',
    user: {
        id: 2,
        nombre: 'Usuario Test',
        email: 'user@test.com',
        role: 'user',
    },
}

const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })

const renderApp = (initialPath = '/') => {
    const queryClient = createQueryClient()

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[initialPath]}>
                <App />
            </MemoryRouter>
        </QueryClientProvider>,
    )
}

vi.mock('../store/useAuthStore', () => ({
    useAuthStore: () => ({
        session: mockSession,
        setSession: mockSetSession,
        logout: mockLogout,
    }),
}))

vi.mock('../store/useUIStore', () => ({
    useUIStore: () => ({
        sidebarOpen: true,
        setSidebarOpen: mockSetSidebarOpen,
        isMobile: false,
        setIsMobile: mockSetIsMobile,
        toggleSidebar: mockToggleSidebar,
        search: '',
        setSearch: mockSetSearch,
    }),
}))

vi.mock('../hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        data: 'online',
    }),
}))

vi.mock('../hooks/useEntityData', () => ({
    useEntityData: vi.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
    })),
}))

vi.mock('../services/socket', () => ({
    getSocket: vi.fn(() => ({
        on: vi.fn(),
        off: vi.fn(),
    })),
    disconnectSocket: vi.fn(),
}))

vi.mock('sonner', () => ({
    toast: {
        info: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('../components/layout/MainLayout', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

    return {
        MainLayout: ({ children, activeView, backendStatus, session, handleLogout, onNotificationsAction }: any) => (
            <div>
                <p data-testid="main-layout">Layout principal</p>
                <p data-testid="active-view">{activeView}</p>
                <p data-testid="backend-status">{backendStatus}</p>
                <p data-testid="session-user">{session.user.nombre}</p>

                <button onClick={handleLogout}>Cerrar sesión</button>
                <button onClick={onNotificationsAction}>Ver notificaciones</button>

                {children}
                <actual.Outlet />
            </div>
        ),
    }
})

vi.mock('../pages/Auth/AuthView', () => ({
    default: ({ onAuthenticated }: any) => (
        <div>
            <p>Vista Login</p>
            <button onClick={() => onAuthenticated(adminSession)}>Autenticar</button>
        </div>
    ),
}))

vi.mock('../pages/Dashboard/DashboardView', () => ({
    default: () => <p>Vista Dashboard</p>,
}))

vi.mock('../pages/Users/UsersView', () => ({
    default: () => <p>Vista Usuarios</p>,
}))

vi.mock('../pages/Trips/TripsView', () => ({
    default: () => <p>Vista Viajes</p>,
}))

vi.mock('../pages/Requests/RequestsView', () => ({
    default: () => <p>Vista Solicitudes</p>,
}))

vi.mock('../pages/Ratings/RatingsView', () => ({
    default: () => <p>Vista Calificaciones</p>,
}))

vi.mock('../pages/Reports/ReportsView', () => ({
    default: () => <p>Vista Reportes</p>,
}))

vi.mock('../pages/AuditLogs/AuditLogsView', () => ({
    default: () => <p>Vista Auditoría</p>,
}))

vi.mock('../pages/Profile/ProfileView', () => ({
    default: () => <p>Vista Perfil</p>,
}))

vi.mock('../pages/Entity/EntityView', () => ({
    default: () => <p>Vista Entidad</p>,
}))

describe('App', () => {
    beforeEach(() => {
        mockSession = null
        vi.clearAllMocks()
    })

    it('debe renderizar AuthView cuando no existe sesión', async () => {
        renderApp('/')

        expect(await screen.findByText('Vista Login')).toBeInTheDocument()
        expect(screen.queryByTestId('main-layout')).not.toBeInTheDocument()
    })

    it('debe enviar la sesión cuando AuthView autentica al usuario', async () => {
        renderApp('/')

        fireEvent.click(await screen.findByText('Autenticar'))

        expect(mockSetSession).toHaveBeenCalledWith(adminSession)
    })

    it('debe renderizar el layout y dashboard cuando existe sesión', async () => {
        mockSession = adminSession

        renderApp('/')

        expect(await screen.findByTestId('main-layout')).toBeInTheDocument()
        expect(screen.getByText('Vista Dashboard')).toBeInTheDocument()
        expect(screen.getByTestId('backend-status')).toHaveTextContent('online')
        expect(screen.getByTestId('session-user')).toHaveTextContent('Admin Test')
    })

    it('debe permitir entrar a usuarios cuando el usuario es admin', async () => {
        mockSession = adminSession

        renderApp('/users')

        expect(await screen.findByText('Vista Usuarios')).toBeInTheDocument()
        expect(screen.getByTestId('active-view')).toHaveTextContent('users')
    })

    it('debe redirigir al dashboard si un usuario no admin entra a usuarios', async () => {
        mockSession = userSession

        renderApp('/users')

        await waitFor(() => {
            expect(screen.getByText('Vista Dashboard')).toBeInTheDocument()
        })
    })

    it('debe cerrar sesión correctamente desde el layout', async () => {
        mockSession = adminSession

        const { disconnectSocket } = await import('../services/socket')

        renderApp('/')

        fireEvent.click(await screen.findByText('Cerrar sesión'))

        await waitFor(() => {
            expect(disconnectSocket).toHaveBeenCalledTimes(1)
            expect(mockLogout).toHaveBeenCalledTimes(1)
        })
    })

    it('debe navegar a viajes al presionar acción de notificaciones', async () => {
        mockSession = adminSession

        renderApp('/')

        fireEvent.click(await screen.findByText('Ver notificaciones'))

        await waitFor(() => {
            expect(screen.getByText('Vista Viajes')).toBeInTheDocument()
        })
    })

    it('debe actualizar estado responsive al renderizar', async () => {
        mockSession = adminSession

        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        })

        renderApp('/')

        await waitFor(() => {
            expect(mockSetIsMobile).toHaveBeenCalledWith(true)
            expect(mockSetSidebarOpen).toHaveBeenCalledWith(false)
        })
    })
})