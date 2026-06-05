import { useState, type FormEvent } from 'react'
import { Car, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import type { AuthMode, AuthSession } from '../../types'
import { authService } from '../../services'

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
        const session = await authService.login({
          correo_institucional: formData.correo_institucional,
          password: formData.password,
        })
        authService.saveSession(session)
        onAuthenticated(session)
      } else if (mode === 'register') {
        await authService.register({
          correo_institucional: formData.correo_institucional,
          password: formData.password,
          nombre: formData.nombre,
          carrera: formData.carrera,
          zona_barrio: formData.zona_barrio,
          telefono: formData.telefono || undefined,
        })
        setMessage('Cuenta creada. Ahora puedes iniciar sesion.')
        setMode('login')
        setFormData({
          correo_institucional: formData.correo_institucional,
          password: '',
        })
      } else if (mode === 'recover') {
        const response = await authService.forgotPassword(formData.correo_institucional)
        setMessage(response.devResetToken
          ? `${response.message} Token de desarrollo: ${response.devResetToken}`
          : response.message)
        setMode('reset')
        setFormData({
          correo_institucional: formData.correo_institucional,
          token: response.devResetToken ?? '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('Las contrasenas no coinciden')
        }

        await authService.resetPassword({
          token: formData.token,
          newPassword: formData.newPassword,
        })
        setMessage('Contrasena restablecida. Ya puedes iniciar sesion.')
        setMode('login')
        setFormData({
          correo_institucional: formData.correo_institucional,
          password: '',
          newPassword: '',
          confirmPassword: '',
          token: '',
        })
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo completar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-night-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-uride overflow-hidden shadow-night-xl border border-night-200">

        {/* Hero Section */}
        <section className="bg-linear-to-br from-uride-500 to-uride-700 p-6 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden min-h-[300px] lg:min-h-full">
          {/* Decorative wave */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Brand */}
            <div className="flex items-center gap-4 mb-8 lg:mb-12">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 backdrop-blur-sm rounded-uride-sm flex items-center justify-center border border-white/30">
                <Car className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight">U-Ride</h1>
                <p className="text-uride-100 text-xs lg:text-sm font-medium">Comunidad estudiantil verificada</p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-4 lg:space-y-6">
              <p className="text-uride-100 text-[10px] lg:text-sm font-semibold uppercase tracking-widest">
                Transporte compartido
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                Coordina viajes seguros desde una sola interfaz.
              </h2>
              <p className="text-uride-50/90 text-sm lg:text-base leading-relaxed max-w-md">
                Acceso institucional, gestion de rutas, solicitudes, reputacion y reportes con una experience clara para web y movil.
              </p>
            </div>
          </div>

          {/* Highlights */}
          <div className="relative z-10 mt-8 lg:mt-12 flex flex-wrap gap-2">
            {['Correo institucional', 'Roles y trazabilidad', 'Reputacion comunitaria'].map((item) => (
              <span 
                key={item}
                className="inline-flex items-center px-3 py-1.5 lg:px-4 lg:py-2 bg-white/15 backdrop-blur-sm rounded-full text-[10px] lg:text-sm font-medium border border-white/20"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Auth Card */}
        <section className="bg-white p-6 sm:p-12 lg:p-16 flex flex-col justify-center">
          {/* Tabs */}
          <div className="flex gap-1 bg-night-100 rounded-uride-xs p-1 mb-8" role="tablist" aria-label="Autenticacion">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'login' 
                  ? 'bg-white text-night-900 shadow-sm' 
                  : 'text-night-500 hover:text-night-700 hover:bg-night-200/50'
              }`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'register' 
                  ? 'bg-white text-night-900 shadow-sm' 
                  : 'text-night-500 hover:text-night-700 hover:bg-night-200/50'
              }`}
            >
              Registro
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-night-900 mb-2">
              {mode === 'login' 
                ? 'Iniciar sesion' 
                : mode === 'register' 
                  ? 'Crear cuenta' 
                  : mode === 'recover' 
                    ? 'Recuperar contrasena' 
                    : 'Restablecer contrasena'}
            </h2>
            <p className="text-night-500 text-sm leading-relaxed">
              {mode === 'login'
                ? 'Usa tu correo institucional registrado.'
                : mode === 'register'
                  ? 'Registra tu perfil basico de estudiante.'
                  : mode === 'recover'
                    ? 'Solicita un token temporal para restablecer el acceso.'
                    : 'Ingresa el token temporal y define una nueva contrasena.'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <label className="label-uride">
                  Correo institucional
                </label>
                <input
                  type="email"
                  required
                  pattern="[a-z0-9._%+-]+@uta\.edu\.ec$"
                  title="El correo debe ser del dominio @uta.edu.ec"
                  value={formData.correo_institucional ?? ''}
                  onChange={(event) => updateField('correo_institucional', event.target.value)}
                  className="input-uride"
                  placeholder="usuario@uta.edu.ec"
                />
              </div>
            )}

            {mode !== 'recover' && mode !== 'reset' && (
              <div className="space-y-1.5">
                <label className="label-uride">
                  Contrasena
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password ?? ''}
                  onChange={(event) => updateField('password', event.target.value)}
                  className="input-uride"
                  placeholder="Minimo 6 caracteres"
                />
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div className="space-y-1.5">
                  <label className="label-uride">
                    Token temporal
                  </label>
                  <input
                    required
                    value={formData.token ?? ''}
                    onChange={(event) => updateField('token', event.target.value)}
                    className="input-uride"
                    placeholder="Ingresa el token recibido"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="label-uride">
                    Nueva contrasena
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.newPassword ?? ''}
                    onChange={(event) => updateField('newPassword', event.target.value)}
                    className="input-uride"
                    placeholder="Minimo 6 caracteres"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="label-uride">
                    Confirmar contrasena
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.confirmPassword ?? ''}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    className="input-uride"
                    placeholder="Repite la contrasena"
                  />
                </div>
              </>
            )}

            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label className="label-uride">
                    Nombre completo
                  </label>
                  <input
                    required
                    value={formData.nombre ?? ''}
                    onChange={(event) => updateField('nombre', event.target.value)}
                    className="input-uride"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="label-uride">
                    Carrera
                  </label>
                  <input
                    required
                    value={formData.carrera ?? ''}
                    onChange={(event) => updateField('carrera', event.target.value)}
                    className="input-uride"
                    placeholder="Ej. Ingenieria de Software"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="label-uride">
                    Zona o barrio
                  </label>
                  <input
                    required
                    value={formData.zona_barrio ?? ''}
                    onChange={(event) => updateField('zona_barrio', event.target.value)}
                    className="input-uride"
                    placeholder="Ej. Ciudad Jardin"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="label-uride">
                    Telefono <span className="text-night-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    title="El teléfono debe tener exactamente 10 dígitos numéricos"
                    value={formData.telefono ?? ''}
                    onChange={(event) => updateField('telefono', event.target.value.replace(/\D/g, ''))}
                    className="input-uride"
                    placeholder="0987654321"
                  />
                </div>
              </>
            )}

            {/* Messages */}
            {message && (
              <div className="alert-uride-info flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-info-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-info-900 text-sm mb-0.5">Accion completada</p>
                  <p className="text-info-900 text-sm">{message}</p>
                </div>
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-uride-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900 text-sm mb-0.5">Error</p>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="btn-uride-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  Procesando...
                </span>
              ) : mode === 'login' 
                ? 'Entrar' 
                : mode === 'register' 
                  ? 'Crear cuenta' 
                  : mode === 'recover' 
                    ? 'Solicitar token' 
                    : 'Restablecer contrasena'}
            </button>

            {/* Secondary Actions */}
            {mode === 'login' && (
              <button 
                type="button" 
                onClick={() => switchMode('recover')}
                className="btn-uride-ghost w-full"
              >
                ¿Olvidaste tu contrasena? Recuperar acceso
              </button>
            )}
            {(mode === 'recover' || mode === 'reset') && (
              <button 
                type="button" 
                onClick={() => switchMode('login')}
                className="btn-uride-ghost w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Volver a iniciar sesion
              </button>
            )}
          </form>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-night-400">
            Al continuar, aceptas nuestros{' '}
            <a href="#" className="link-uride text-xs">Terminos de servicio</a>
            {' '}y{' '}
            <a href="#" className="link-uride text-xs">Politica de privacidad</a>
          </p>
        </section>
      </div>
    </main>
  )
}

export default AuthView