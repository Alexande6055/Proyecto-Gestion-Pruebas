import { useState, type FormEvent } from 'react'
import type { AuthMode, AuthSession } from '../../types'
import { requestJson } from '../../services/api'

interface AuthViewProps {
  onAuthenticated: (session: AuthSession) => void
}

export function AuthView({ onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const updateField = (key: string, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }))
  }

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setMessage('')
    setError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      if (mode === 'login') {
        const session = await requestJson<AuthSession>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            correo_institucional: formData.correo_institucional,
            password: formData.password,
          }),
        })
        localStorage.setItem('uride-session', JSON.stringify(session))
        onAuthenticated(session)
      } else if (mode === 'register') {
        await requestJson<{ message: string }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            correo_institucional: formData.correo_institucional,
            password: formData.password,
            nombre: formData.nombre,
            carrera: formData.carrera,
            zona_barrio: formData.zona_barrio,
            telefono: formData.telefono || undefined,
          }),
        })
        setMessage('Cuenta creada. Ahora puedes iniciar sesion.')
        setMode('login')
        setFormData({
          correo_institucional: formData.correo_institucional,
          password: '',
        })
      } else {
        await requestJson<{ message: string }>('/api/auth/recover-password', {
          method: 'PATCH',
          body: JSON.stringify({
            correo_institucional: formData.correo_institucional,
            newPassword: formData.newPassword,
          }),
        })
        setMessage('Contrasena actualizada. Ya puedes iniciar sesion.')
        setMode('login')
        setFormData({
          correo_institucional: formData.correo_institucional,
          password: '',
          newPassword: '',
        })
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo completar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="brand auth-brand">
          <span>UR</span>
          <div>
            <strong>U-Ride</strong>
            <small>Comunidad estudiantil verificada</small>
          </div>
        </div>
        <div>
          <p className="eyebrow">Transporte compartido</p>
          <h1>Coordina viajes seguros desde una sola interfaz.</h1>
          <p className="hero-copy">
            Acceso institucional, gestion de rutas, solicitudes, reputacion y reportes con una experiencia clara para web y movil.
          </p>
        </div>
        <div className="auth-highlights">
          <span>Correo institucional</span>
          <span>Roles y trazabilidad</span>
          <span>Reputacion comunitaria</span>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Autenticacion">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Ingresar
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
          >
            Registro
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <h2>{mode === 'login' ? 'Iniciar sesion' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contrasena'}</h2>
            <p>
              {mode === 'login'
                ? 'Usa tu correo institucional registrado.'
                : mode === 'register'
                  ? 'Registra tu perfil basico de estudiante.'
                  : 'Actualiza la contrasena asociada a tu correo institucional.'}
            </p>
          </div>

          <label className="field">
            <span>Correo institucional</span>
            <input
              type="email"
              required
              value={formData.correo_institucional ?? ''}
              onChange={(event) => updateField('correo_institucional', event.target.value)}
            />
          </label>

          {mode !== 'recover' && (
            <label className="field">
              <span>Contrasena</span>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password ?? ''}
                onChange={(event) => updateField('password', event.target.value)}
              />
            </label>
          )}

          {mode === 'recover' && (
            <label className="field">
              <span>Nueva contrasena</span>
              <input
                type="password"
                required
                minLength={6}
                value={formData.newPassword ?? ''}
                onChange={(event) => updateField('newPassword', event.target.value)}
              />
            </label>
          )}

          {mode === 'register' && (
            <>
              <label className="field">
                <span>Nombre completo</span>
                <input
                  required
                  value={formData.nombre ?? ''}
                  onChange={(event) => updateField('nombre', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Carrera</span>
                <input
                  required
                  value={formData.carrera ?? ''}
                  onChange={(event) => updateField('carrera', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Zona o barrio</span>
                <input
                  required
                  value={formData.zona_barrio ?? ''}
                  onChange={(event) => updateField('zona_barrio', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Telefono</span>
                <input
                  value={formData.telefono ?? ''}
                  onChange={(event) => updateField('telefono', event.target.value)}
                />
              </label>
            </>
          )}

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear cuenta' : 'Actualizar contrasena'}
          </button>
          {mode === 'login' && (
            <button type="button" className="secondary" onClick={() => switchMode('recover')}>
              Recuperar contrasena
            </button>
          )}
          {mode === 'recover' && (
            <button type="button" className="secondary" onClick={() => switchMode('login')}>
              Volver a iniciar sesion
            </button>
          )}
        </form>
      </section>
    </main>
  )
}
