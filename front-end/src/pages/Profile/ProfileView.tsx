import { useState, type FormEventHandler } from 'react'
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  KeyRound,
  Save,
  Loader2,
  AlertCircle,
  MapPin,
  GraduationCap,
  Phone,
  Camera,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'

import type { AuthSession } from '../../types'
import { usersService, authService } from '../../services'
import { Badge } from '../../components/common/Badge'

interface ProfileViewProps {
  session: AuthSession
  onSessionUpdate: (newSession: AuthSession) => void
}

export function ProfileView({ session, onSessionUpdate }: ProfileViewProps) {
  const [formData, setFormData] = useState({
    nombre: session.user.nombre,
    carrera: '',
    zona_barrio: '',
    telefono: '',
    foto_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const payload = Object.fromEntries(
        Object.entries(formData)
          .map(([key, value]) => [key, value.trim()])
          .filter(([, value]) => value),
      )

      await usersService.update(session.user.id, payload)

      const newSession: AuthSession = {
        ...session,
        user: {
          ...session.user,
          nombre: payload.nombre ?? session.user.nombre,
        },
      }

      authService.saveSession(newSession)
      onSessionUpdate(newSession)
      setMessage('Perfil actualizado correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage('')
    setPasswordError('')

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Las contrasenas no coinciden')
      }

      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordMessage('Contrasena actualizada correctamente.')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'No se pudo actualizar la contrasena')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* HEADER */}
      <section className="relative overflow-hidden rounded-uride bg-gradient-to-r from-uride-500 to-uride-700 p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-uride-100">
              <User className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-widest">Configuracion</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
            <p className="text-uride-50/90 text-sm max-w-md">
              Gestiona tu informacion personal y de contacto.
            </p>
          </div>
          <Badge tone="info" className="bg-white/20 text-white border border-white/30 backdrop-blur-sm">
            ID: {session.user.id}
          </Badge>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN - Personal Data */}
        <div className="lg:col-span-2 space-y-6">

          {/* Personal Data Form */}
          <div className="card-uride">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-night-100">
              <div className="w-8 h-8 rounded-lg bg-uride-100 flex items-center justify-center">
                <User className="w-4 h-4 text-uride-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-night-900">Datos Personales</h2>
                <p className="text-xs text-night-500">Actualiza tu informacion de perfil</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="label-uride flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-uride-500" />
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    className="input-uride"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="label-uride flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-uride-500" />
                    Carrera
                  </label>
                  <input
                    type="text"
                    value={formData.carrera}
                    onChange={(e) => setFormData({ ...formData, carrera: e.target.value })}
                    className="input-uride"
                    placeholder="Ej: Ingenieria de Software"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="label-uride flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-uride-500" />
                    Zona o barrio
                  </label>
                  <input
                    type="text"
                    value={formData.zona_barrio}
                    onChange={(e) => setFormData({ ...formData, zona_barrio: e.target.value })}
                    className="input-uride"
                    placeholder="Ej: Ficoa / Ingahurco"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="label-uride flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-uride-500" />
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="input-uride"
                    placeholder="0987654321"
                  />
                </div>
              </div>

              {/* Messages */}
              {message && (
                <div className="alert-uride-warning">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Guardado exitoso
                  </p>
                  <p>{message}</p>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-uride-xs text-red-800 text-sm">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Error
                  </p>
                  <p>{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="btn-uride-primary w-full sm:w-auto"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Actualizar Perfil
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Password Form */}
          <div className="card-uride">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-night-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-night-900">Cambiar Contrasena</h2>
                <p className="text-xs text-night-500">Actualiza tu contrasena de acceso</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="label-uride flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-uride-500" />
                    Contrasena actual
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="input-uride pr-10"
                      placeholder="Tu contrasena actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-night-400 hover:text-night-600 transition-colors"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="label-uride flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-uride-500" />
                    Nueva contrasena
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="input-uride pr-10"
                      placeholder="Minimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-night-400 hover:text-night-600 transition-colors"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="label-uride flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-uride-500" />
                    Confirmar contrasena
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="input-uride pr-10"
                      placeholder="Repite la contrasena"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-night-400 hover:text-night-600 transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Messages */}
              {passwordMessage && (
                <div className="alert-uride-warning">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Contrasena actualizada
                  </p>
                  <p>{passwordMessage}</p>
                </div>
              )}
              {passwordError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-uride-xs text-red-800 text-sm">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Error
                  </p>
                  <p>{passwordError}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={passwordLoading}
                className="btn-uride-primary w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-none hover:shadow-lg"
              >
                {passwordLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    Actualizar Contrasena
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN - Account Info */}
        <div className="space-y-6">

          {/* Account Info Card */}
          <div className="card-uride">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-night-100">
              <div className="w-8 h-8 rounded-lg bg-uride-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-uride-600" />
              </div>
              <h2 className="text-lg font-bold text-night-900">Informacion de Cuenta</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-uride-xs bg-night-50">
                <Mail className="w-5 h-5 text-uride-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-night-500 uppercase tracking-wider">Correo Institucional</p>
                  <p className="text-sm font-semibold text-night-900 mt-0.5">{session.user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-uride-xs bg-night-50">
                <Shield className="w-5 h-5 text-uride-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-night-500 uppercase tracking-wider">Rol en el Sistema</p>
                  <div className="mt-1">
                    <Badge tone="success" className="capitalize">
                      {session.user.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-uride-xs bg-night-50">
                <CheckCircle2 className="w-5 h-5 text-uride-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-night-500 uppercase tracking-wider">Estado</p>
                  <div className="mt-1">
                    <Badge tone="success">Activo</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Tips Card */}
          <div className="card-uride">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-night-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-night-900">Consejos de Seguridad</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-start gap-2 text-sm text-night-600">
                <CheckCircle2 className="w-4 h-4 text-uride-500 mt-0.5 flex-shrink-0" />
                <span>Usa una contrasena de al menos 8 caracteres</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-night-600">
                <CheckCircle2 className="w-4 h-4 text-uride-500 mt-0.5 flex-shrink-0" />
                <span>Combina letras, numeros y simbolos</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-night-600">
                <CheckCircle2 className="w-4 h-4 text-uride-500 mt-0.5 flex-shrink-0" />
                <span>No compartas tu contrasena con nadie</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}