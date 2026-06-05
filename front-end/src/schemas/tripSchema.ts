import { z } from 'zod'

export const tripSchema = z.object({
  origen_zona: z.string().min(2, 'El origen debe tener al menos 2 caracteres'),
  destino_zona: z.string().min(2, 'El destino debe tener al menos 2 caracteres'),
  fecha_hora: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha y hora inválida',
  }),
  cupos_disponibles: z.number().int().min(1, 'Debe haber al menos 1 cupo').max(10, 'Máximo 10 cupos'),
  notas_reglas: z.string().optional(),
  origen_lat: z.number().optional(),
  origen_lng: z.number().optional(),
  destino_lat: z.number().optional(),
  destino_lng: z.number().optional(),
})

export type TripFormData = z.infer<typeof tripSchema>
