U-Ride: Transporte seguro compartido para estudiantes
En horarios nocturnos y/o de baja afluencia, muchos estudiantes tienen dificultades para
movilizarse de forma segura y económica entre su casa y la institución. La falta de
coordinación, el desconocimiento de rutas confiables y la ausencia de mecanismos de
verificación incrementan el riesgo y el costo del transporte.
Problema para resolver
Diseñar y modelar un sistema que permita a estudiantes de una misma institución
coordinar viajes compartidos de manera segura, controlada y organizada, priorizando:
• Verificación de pertenencia institucional (validación con correo personal)
• Coordinación por zona/horario
• Reglas mínimas de seguridad
• Calificación y comportamiento responsable dentro de la comunidad
Objetivo general
Modelar y posteriormente implementar (en el segundo parcial) una aplicación que permita
a estudiantes publicar y unirse a viajes compartidos, con controles básicos de seguridad y
reputación.
Alcance del sistema
Roles
• Estudiante (pasajero): busca viajes, solicita unirse, califica.
• Estudiante conductor/a: publica viajes, acepta/rechaza solicitudes, califica.
• Administrador/a: gestiona reportes, revisa usuarios y configura parámetros
generales.
Nota: Un estudiante puede actuar como pasajero y conductor/a.
Requerimientos funcionales mínimos
RF1. Registro e inicio de sesión de estudiantes usando correo institucional (verificación
por código o enlace).
RF2. Gestión de perfil (nombre, carrera, foto opcional, número de contacto opcional,
zona/barrio de referencia).
RF3. Publicación de viaje por parte del conductor/a indicando: origen aproximado (zona),
destino (campus u otra zona), fecha/hora, cupos, notas/reglas.
RF4. Búsqueda y filtrado de viajes por zona, fecha/hora y disponibilidad.
RF5. Solicitud para unirse a un viaje (pasajero envía solicitud).
RF6. Gestión de solicitudes (conductor/a acepta o rechaza).
RF7. Confirmación de participación (la app registra quién quedó confirmado).
RF8. Calificación y reseña después del viaje (pasajero a conductor/a y conductor/a a
pasajero).
RF9. Reglas mínimas de seguridad visibles antes de confirmar (ej.: puntualidad, respeto,
no compartir datos, etc.).
RF10. Reportes: un estudiante puede reportar a otro por conducta indebida (motivo +
evidencia opcional).
RF11. Administración básica: el administrador/a puede revisar reportes y aplicar acciones
(advertir, suspender temporalmente).
Requerimientos no funcionales (mínimos)
RNF1. Seguridad: contraseñas cifradas, roles.
RNF2. Privacidad: ubicación aproximada por zona (no direcciones exactas públicas).
RNF3. Usabilidad: interfaz sencilla (plus para móvil).
RNF4. Trazabilidad: registro de eventos clave (publicación, aceptación, cancelación,
finalización).
Reglas y restricciones
• La app funciona solo para estudiantes verificados (dominio institucional).
• La ubicación se maneja por zonas/barrio/sectores (no coordenadas exactas
obligatorias).
• Los viajes son coordinados; la app debe procesa pagos
• El conductor/a controla aceptación de solicitudes.
• Las calificaciones afectan una reputación visible (promedio y cantidad de viajes).
Extras
Integración real con mapas en tiempo real (GPS tracking en vivo).
Aplicación adaptada para móvil

---

## Modelo de Datos (Diseño de Base de Datos)

El sistema utiliza **PostgreSQL** con **TypeORM** para la persistencia. La arquitectura se basa en las siguientes entidades y relaciones:

### 1. Entidades Principales

#### **Usuario (users)**
- `id`: UUID (Primary Key)
- `correo_institucional`: string (Unique, solo dominios autorizados)
- `password_hash`: string
- `nombre`: string
- `carrera`: string
- `foto_url`: string (opcional)
- `telefono`: string (opcional)
- `zona_barrio`: string
- `rol`: enum ('estudiante', 'admin')
- `reputacion_promedio`: decimal (0.0 - 5.0)
- `total_viajes`: integer
- `estado`: enum ('activo', 'suspendido', 'advertido')
- `created_at`: timestamp

#### **Viaje (trips)**
- `id`: UUID (PK)
- `conductor_id`: UUID (FK -> Usuario.id)
- `origen_zona`: string
- `destino_zona`: string
- `fecha_hora`: timestamp
- `cupos_disponibles`: integer
- `notas_reglas`: text
- `estado`: enum ('abierto', 'completo', 'cancelado', 'finalizado')
- `created_at`: timestamp

#### **Solicitud (requests)**
- `id`: UUID (PK)
- `viaje_id`: UUID (FK -> Viaje.id)
- `pasajero_id`: UUID (FK -> Usuario.id)
- `estado`: enum ('pendiente', 'aceptada', 'rechazada')
- `fecha_solicitud`: timestamp

#### **Calificacion (ratings)**
- `id`: UUID (PK)
- `viaje_id`: UUID (FK -> Viaje.id)
- `calificador_id`: UUID (FK -> Usuario.id)
- `calificado_id`: UUID (FK -> Usuario.id)
- `puntuacion`: integer (1-5)
- `comentario`: text
- `created_at`: timestamp

#### **Reporte (reports)**
- `id`: UUID (PK)
- `reportante_id`: UUID (FK -> Usuario.id)
- `reportado_id`: UUID (FK -> Usuario.id)
- `viaje_id`: UUID (FK -> Viaje.id, opcional)
- `motivo`: string
- `evidencia_url`: string
- `estado`: enum ('pendiente', 'revisado', 'resuelto')
- `accion_tomada`: string (opcional)

#### **Log_Trazabilidad (audit_logs)**
- `id`: UUID (PK)
- `usuario_id`: UUID (FK -> Usuario.id)
- `accion`: string
- `detalles`: jsonb
- `fecha_hora`: timestamp

### 2. Relaciones Clave
- **1:N Usuario-Viajes**: Un conductor publica múltiples viajes.
- **1:N Viaje-Solicitudes**: Un viaje recibe múltiples peticiones de estudiantes.
- **N:N Usuario-Viaje (vía Solicitudes)**: Relación que define los pasajeros de un viaje.
- **1:N Usuario-Calificaciones**: Un usuario recibe múltiples puntuaciones.
- **1:N Usuario-Reportes**: Un usuario puede reportar a varios o ser reportado.

### 3. Restricciones de Negocio (Database Level)
- Un usuario no puede solicitar su propio viaje (`CHECK (pasajero_id != conductor_id)` via logic).
- Las calificaciones solo pueden ocurrir después de que un viaje pase a estado 'finalizado'.
- El estado 'completo' de un viaje se activa automáticamente cuando `cupos_disponibles` llega a 0.