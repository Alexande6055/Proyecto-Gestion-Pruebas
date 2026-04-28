import { useState, type FormEventHandler } from 'react'
import type { AuthSession } from '../../types'
import { requestJson } from '../../services/api'
import { Badge } from '../../components/common/Badge'

interface ProfileViewProps {
  session: AuthSession
  onSessionUpdate: (newSession: AuthSession) => void
}

export function ProfileView({ session, onSessionUpdate }: ProfileViewProps) {
  const [formData, setFormData] = useState({
    nombre: session.user.nombre,
    carrera: '', // El backend tiene estos datos pero la sesion inicial es limitada
    zona_barrio: '',
    telefono: '',
    foto_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const updatedUser = await requestJson<any>(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      })

      const newSession: AuthSession = {
        ...session,
        user: {
          ...session.user,
          nombre: updatedUser.nombre,
        },
      }

      localStorage.setItem('uride-session', JSON.stringify(newSession))
      onSessionUpdate(newSession)
      setMessage('Perfil actualizado correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="view-stack">
      <section className="section-head">
        <div>
          <p className="eyebrow">Configuracion</p>
          <h1>Mi Perfil</h1>
          <p>Gestiona tu informacion personal y de contacto.</p>
        </div>
        <Badge tone="info">{`ID: ${session.user.id}`}</Badge>
      </section>

      <div className="entity-layout">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-title">
            <h2>Datos Personales</h2>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Nombre completo</span>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Carrera</span>
              <input
                type="text"
                value={formData.carrera}
                onChange={(e) => setFormData({ ...formData, carrera: e.target.value })}
                placeholder="Ej: Ingenieria de Software"
              />
            </label>
            <label className="field">
              <span>Zona o barrio</span>
              <input
                type="text"
                value={formData.zona_barrio}
                onChange={(e) => setFormData({ ...formData, zona_barrio: e.target.value })}
                placeholder="Ej: Ficoa / Ingahurco"
              />
            </label>
            <label className="field">
              <span>Telefono</span>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="0987654321"
              />
            </label>
          </div>

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Actualizar Perfil'}
          </button>
        </form>

        <div className="panel content-panel">
          <div className="panel-title">
            <h2>Informacion de Cuenta</h2>
          </div>
          <div className="compact-row">
            <strong>Correo Institucional</strong>
            <span>{session.user.email}</span>
          </div>
          <div className="compact-row">
            <strong>Rol en el Sistema</strong>
            <Badge tone="ok">{session.user.role}</Badge>
          </div>
          <div className="compact-row">
            <strong>Estado</strong>
            <Badge tone="ok">Activo</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
