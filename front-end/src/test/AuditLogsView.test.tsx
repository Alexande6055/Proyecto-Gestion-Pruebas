import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import AuditLogsView from '../pages/AuditLogs/AuditLogsView'
import type { AuthSession, EntityState, ViewKey } from '../types'
import { managedViews } from '../constants/entities'

vi.mock('../pages/Entity/EntityView', () => ({
  EntityView: ({
    config,
    state,
    data,
    search,
    session,
    onCreated,
  }: any) => (
    <div data-testid="entity-view">
      <span>{config.key}</span>
      <span>{config.title}</span>
      <span>{config.endpoint}</span>
      <span>{state.loading ? 'loading' : 'not-loading'}</span>
      <span>{search}</span>
      <span>{session.user.nombre}</span>
      <button type="button" onClick={onCreated}>
        Crear
      </button>
      <span>{Object.keys(data).length}</span>
    </div>
  ),
}))

const createEntityState = (rows: any[] = []): EntityState => ({
  rows,
  loading: false,
  error: null,
})

const createData = (): Record<ViewKey, EntityState> => {
  return Object.fromEntries(
    managedViews.map((key) => [key, createEntityState()])
  ) as Record<ViewKey, EntityState>
}

const sessionMock: AuthSession = {
  token: 'token-prueba',
  user: {
    id: 1,
    nombre: 'Ana Torres',
    correo_institucional: 'ana@uta.edu.ec',
    rol: 'admin',
    role: 'admin',
  },
} as AuthSession

describe('AuditLogsView', () => {
  it('debe renderizar EntityView', () => {
    render(
      <AuditLogsView
        state={createEntityState()}
        data={createData()}
        session={sessionMock}
        onCreated={vi.fn()}
        search=""
      />
    )

    expect(screen.getByTestId('entity-view')).toBeInTheDocument()
  })

  it('debe enviar la configuración de audit_logs a EntityView', () => {
    render(
      <AuditLogsView
        state={createEntityState()}
        data={createData()}
        session={sessionMock}
        onCreated={vi.fn()}
        search=""
      />
    )

    expect(screen.getByText('audit_logs')).toBeInTheDocument()
  })

  it('debe pasar el estado recibido por props', () => {
    const state = createEntityState()
    state.loading = true

    render(
      <AuditLogsView
        state={state}
        data={createData()}
        session={sessionMock}
        onCreated={vi.fn()}
        search=""
      />
    )

    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('debe pasar el texto de búsqueda recibido por props', () => {
    render(
      <AuditLogsView
        state={createEntityState()}
        data={createData()}
        session={sessionMock}
        onCreated={vi.fn()}
        search="inicio sesión"
      />
    )

    expect(screen.getByText('inicio sesión')).toBeInTheDocument()
  })

  it('debe pasar la sesión recibida por props', () => {
    render(
      <AuditLogsView
        state={createEntityState()}
        data={createData()}
        session={sessionMock}
        onCreated={vi.fn()}
        search=""
      />
    )

    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
  })

  it('debe ejecutar onCreated cuando EntityView lo llama', () => {
    const onCreated = vi.fn()

    render(
      <AuditLogsView
        state={createEntityState()}
        data={createData()}
        session={sessionMock}
        onCreated={onCreated}
        search=""
      />
    )

    screen.getByRole('button', { name: /crear/i }).click()

    expect(onCreated).toHaveBeenCalledTimes(1)
  })
})