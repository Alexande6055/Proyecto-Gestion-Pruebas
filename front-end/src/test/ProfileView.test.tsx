import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProfileView from '../pages/Profile/ProfileView'
import type { AuthSession } from '../types'
import { authService, usersService } from '../services'

vi.mock('../services', () => ({
  usersService: {
    update: vi.fn(),
  },
  authService: {
    saveSession: vi.fn(),
    changePassword: vi.fn(),
  },
}))

const sessionMock: AuthSession = {
  token: 'token-prueba',
  user: {
    id: 1,
    nombre: 'Ana Torres',
    email: 'ana@uta.edu.ec',
    correo_institucional: 'ana@uta.edu.ec',
    role: 'admin',
    rol: 'admin',
  },
} as AuthSession

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar el encabezado del perfil', () => {
    render(<ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />)

    expect(screen.getByText('Configuracion')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /mi perfil/i })).toBeInTheDocument()
    expect(screen.getByText('Gestiona tu informacion personal y de contacto.')).toBeInTheDocument()
    expect(screen.getByText('ID: 1')).toBeInTheDocument()
  })

  it('debe renderizar la sección de datos personales', () => {
    render(<ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />)

    expect(screen.getByText('Datos Personales')).toBeInTheDocument()
    expect(screen.getByText('Actualiza tu informacion de perfil')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Ana Torres')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ej: Ingenieria de Software')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ej: Ficoa / Ingahurco')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0987654321')).toBeInTheDocument()
  })

  it('debe renderizar la sección de cambio de contraseña', () => {
    render(<ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />)

    expect(screen.getByText('Cambiar Contrasena')).toBeInTheDocument()
    expect(screen.getByText('Actualiza tu contrasena de acceso')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tu contrasena actual')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Minimo 6 caracteres')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Repite la contrasena')).toBeInTheDocument()
  })

  it('debe renderizar la información de cuenta', () => {
    render(<ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />)

    expect(screen.getByText('Informacion de Cuenta')).toBeInTheDocument()
    expect(screen.getByText('Correo Institucional')).toBeInTheDocument()
    expect(screen.getByText('ana@uta.edu.ec')).toBeInTheDocument()
    expect(screen.getByText('Rol en el Sistema')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('debe renderizar los consejos de seguridad', () => {
    render(<ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />)

    expect(screen.getByText('Consejos de Seguridad')).toBeInTheDocument()
    expect(screen.getByText('Usa una contrasena de al menos 8 caracteres')).toBeInTheDocument()
    expect(screen.getByText('Combina letras, numeros y simbolos')).toBeInTheDocument()
    expect(screen.getByText('No compartas tu contrasena con nadie')).toBeInTheDocument()
  })

  it('debe actualizar el perfil correctamente', async () => {
    const onSessionUpdate = vi.fn()

    vi.mocked(usersService.update).mockResolvedValueOnce({} as any)

    render(
      <ProfileView
        session={sessionMock}
        onSessionUpdate={onSessionUpdate}
      />
    )

    const nombreInput = screen.getByDisplayValue('Ana Torres')
    const carreraInput = screen.getByPlaceholderText('Ej: Ingenieria de Software')
    const zonaInput = screen.getByPlaceholderText('Ej: Ficoa / Ingahurco')
    const telefonoInput = screen.getByPlaceholderText('0987654321')

    fireEvent.change(nombreInput, {
      target: { value: 'Ana Actualizada' },
    })

    fireEvent.change(carreraInput, {
      target: { value: 'Software' },
    })

    fireEvent.change(zonaInput, {
      target: { value: 'Ficoa' },
    })

    fireEvent.change(telefonoInput, {
      target: { value: '0999999999' },
    })

    fireEvent.click(screen.getByRole('button', { name: /actualizar perfil/i }))

    await waitFor(() => {
      expect(usersService.update).toHaveBeenCalledWith(1, {
        nombre: 'Ana Actualizada',
        carrera: 'Software',
        zona_barrio: 'Ficoa',
        telefono: '0999999999',
      })
    })

    await waitFor(() => {
      expect(authService.saveSession).toHaveBeenCalled()
      expect(onSessionUpdate).toHaveBeenCalled()
      expect(screen.getByText('Perfil actualizado correctamente.')).toBeInTheDocument()
    })
  })

  it('debe mostrar error cuando falla la actualización del perfil', async () => {
    vi.mocked(usersService.update).mockRejectedValueOnce(
      new Error('No se pudo actualizar')
    )

    render(<ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />)

    const nombreInput = screen.getByDisplayValue('Ana Torres')

    fireEvent.change(nombreInput, {
      target: { value: 'Ana Error' },
    })

    fireEvent.click(screen.getByRole('button', { name: /actualizar perfil/i }))

    expect(await screen.findByText('No se pudo actualizar')).toBeInTheDocument()
  })

  it('debe actualizar la contraseña correctamente', async () => {
    vi.mocked(authService.changePassword).mockResolvedValueOnce({} as any)

    render(<ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Tu contrasena actual'), {
      target: { value: 'actual123' },
    })

    fireEvent.change(screen.getByPlaceholderText('Minimo 6 caracteres'), {
      target: { value: 'nueva123' },
    })

    fireEvent.change(screen.getByPlaceholderText('Repite la contrasena'), {
      target: { value: 'nueva123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /actualizar contrasena/i }))

    await waitFor(() => {
      expect(authService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'actual123',
        newPassword: 'nueva123',
      })
    })

    expect(
      await screen.findByText('Contrasena actualizada correctamente.')
    ).toBeInTheDocument()
  })

  it('debe mostrar error si las contraseñas no coinciden', async () => {
    render(<ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Tu contrasena actual'), {
      target: { value: 'actual123' },
    })

    fireEvent.change(screen.getByPlaceholderText('Minimo 6 caracteres'), {
      target: { value: 'nueva123' },
    })

    fireEvent.change(screen.getByPlaceholderText('Repite la contrasena'), {
      target: { value: 'otra123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /actualizar contrasena/i }))

    expect(await screen.findByText('Las contrasenas no coinciden')).toBeInTheDocument()
    expect(authService.changePassword).not.toHaveBeenCalled()
  })

  it('debe mostrar error cuando falla el cambio de contraseña', async () => {
    vi.mocked(authService.changePassword).mockRejectedValueOnce(
      new Error('Password incorrecto')
    )

    render(<ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Tu contrasena actual'), {
      target: { value: 'actual123' },
    })

    fireEvent.change(screen.getByPlaceholderText('Minimo 6 caracteres'), {
      target: { value: 'nueva123' },
    })

    fireEvent.change(screen.getByPlaceholderText('Repite la contrasena'), {
      target: { value: 'nueva123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /actualizar contrasena/i }))

    expect(await screen.findByText('Password incorrecto')).toBeInTheDocument()
  })

  it('debe cambiar la visibilidad de las contraseñas', () => {
    render(<ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />)

    const currentPasswordInput = screen.getByPlaceholderText('Tu contrasena actual')

    expect(currentPasswordInput).toHaveAttribute('type', 'password')

    const toggleButtons = screen.getAllByRole('button').filter(
      (button) => button.getAttribute('type') === 'button'
    )

    fireEvent.click(toggleButtons[0])

    expect(currentPasswordInput).toHaveAttribute('type', 'text')
  })

  it('debe renderizar el contenedor principal con sus clases actuales', () => {
    const { container } = render(
      <ProfileView session={sessionMock} onSessionUpdate={vi.fn()} />
    )

    const root = container.firstElementChild

    expect(root).toBeInTheDocument()
    expect(root).toHaveClass('max-w-5xl')
    expect(root).toHaveClass('mx-auto')
    expect(root).toHaveClass('space-y-6')
  })
})