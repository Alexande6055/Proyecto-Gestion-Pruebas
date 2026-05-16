import { z } from 'zod'

export const userSchema = z.object({
  correo_institucional: z.string().email('Correo institucional inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  carrera: z.string().min(2, 'Carrera inválida'),
  foto_url: z.string().url('URL de foto inválida').or(z.literal('')),
  telefono: z.string().min(7, 'Teléfono inválido'),
  zona_barrio: z.string().min(3, 'Zona/Barrio inválido'),
  estado: z.enum(['activo', 'suspendido', 'advertido']).default('activo'),
})

export type UserFormData = z.infer<typeof userSchema>
