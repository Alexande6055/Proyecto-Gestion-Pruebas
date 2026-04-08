1. Modelo de datos (Entidades y relaciones)

Basado en los roles y requerimientos, propongo las siguientes entidades:
Entidad	Atributos principales
Usuario	id, correo_institucional, contraseña (hash), nombre, carrera, foto_url (opcional), telefono (opcional), zona_barrio, rol (estudiante / admin), reputacion_promedio, total_viajes, estado (activo, suspendido, advertido)
Viaje	id, id_conductor (FK a Usuario), origen_zona, destino_zona, fecha_hora, cupos_disponibles, notas_reglas, estado (abierto, completo, cancelado, finalizado)
Solicitud	id, id_viaje (FK), id_pasajero (FK), estado (pendiente, aceptada, rechazada), fecha_solicitud
Participacion	id, id_viaje, id_estudiante, confirmado (bool), cancelado (bool) – opcional si se maneja solo con Solicitud aceptada
Calificacion	id, id_viaje, id_calificador (FK a Usuario), id_calificado (FK a Usuario), puntuacion (1-5), comentario, fecha
Reporte	id, id_reportante, id_reportado, id_viaje (opcional), motivo, evidencia_url (opcional), fecha, estado (pendiente, revisado, resuelto), accion_tomada (advertencia, suspension_temporal)
Log_Trazabilidad	id, id_usuario, accion (publicar_viaje, aceptar_solicitud, cancelar, finalizar, etc.), fecha_hora, ip (opcional)
Relaciones clave:

    Un Usuario puede publicar muchos Viajes (como conductor)

    Un Viaje tiene muchas Solicitudes de pasajeros

    Un Usuario puede enviar muchas Calificaciones y muchos Reportes

    Calificacion y Reporte están ligados a un Viaje (para contexto)

2. Casos de uso principales (diagrama de secuencia simplificado)
CU1 – Registro y verificación

    Usuario ingresa correo institucional y datos básicos.

    Sistema envía código/enlace de verificación al correo.

    Usuario valida → cuenta creada con rol estudiante.

CU2 – Publicar viaje (conductor)

    Conductor autenticado completa formulario: origen_zona, destino_zona, fecha_hora, cupos, notas.

    Sistema registra viaje con estado abierto.

    Se registra en Log_Trazabilidad.

CU3 – Buscar y solicitar un viaje (pasajero)

    Pasajero filtra viajes (zona, fecha, disponibilidad).

    Selecciona un viaje → envía Solicitud con estado pendiente.

    Conductor recibe notificación (si se implementa).

CU4 – Gestionar solicitudes (conductor)

    Conductor ve lista de solicitudes pendientes para sus viajes activos.

    Acepta o rechaza cada una.

    Si acepta → se reduce cupos_disponibles y se crea Participacion (o se marca solicitud como aceptada).

CU5 – Calificar después del viaje

    Al finalizar el viaje (conductor marca como finalizado), ambos usuarios pueden calificar al otro.

    Se actualiza reputacion_promedio del calificado.

CU6 – Reportar conducta indebida

    Usuario selecciona otro usuario y un viaje, ingresa motivo y evidencia opcional.

    Admin revisa reportes y aplica acción (advertir, suspender temporalmente).

3. Endpoints de API (REST, ejemplo para backend)
Método	Endpoint	Descripción
POST	/auth/register	Registro con verificación por correo
POST	/auth/login	Inicio de sesión (devuelve JWT)
GET	/profile	Obtener perfil propio
PUT	/profile	Actualizar perfil
POST	/trips	Publicar viaje
GET	/trips	Listar viajes con filtros (zona, fecha, cupos>0)
POST	/trips/{id}/requests	Solicitar unirse a viaje
GET	/trips/{id}/requests	Ver solicitudes (conductor)
PUT	/requests/{id}	Aceptar/rechazar solicitud (conductor)
POST	/trips/{id}/complete	Marcar viaje como finalizado (conductor)
POST	/ratings	Crear calificación (viaje, calificado, puntuación)
POST	/reports	Crear reporte
GET	/reports	Listar reportes (solo admin)
PUT	/reports/{id}	Actualizar estado/acción (admin)
4. Reglas de negocio adicionales (a partir del PDF)

    Un estudiante puede ser conductor y pasajero, pero no puede solicitar su propio viaje.

    La ubicación es por zona/barrio (no coordenadas exactas públicas).

    La app no procesa pagos (aunque el PDF dice "debe procesa pagos", asumimos que es un error y no se incluye en el alcance mínimo; si se requiere, sería un extra).

    Calificaciones afectan reputación: visible como promedio y cantidad de viajes.

    Cancelación: si un pasajero cancela después de confirmado, debe registrarse en trazabilidad y podría afectar reputación (opcional).

    Seguridad: contraseñas cifradas (bcrypt), roles mediante JWT.

    Suspensiones: un usuario suspendido no puede publicar ni solicitar viajes hasta que el admin lo reactive.

5. Requerimientos no funcionales – cómo cumplirlos
RNF	Implementación sugerida
Contraseñas cifradas	bcrypt + salt
Roles	Middleware JWT con claim rol
Ubicación por zona	Campo texto + validación contra lista predefinida de zonas
Interfaz sencilla / móvil	Framework responsive (Bootstrap) o PWA, o React Native si da tiempo
Trazabilidad	Tabla Log_Trazabilidad + interceptores en backend que registren acciones clave
6. Posible stack tecnológico (para segundo parcial)

    Backend: Node.js + Express (o Python + Django/Flask) – fácil de implementar rápidamente.

    Base de datos: PostgreSQL o MySQL (relacional, cumple con todas las entidades).

    Frontend: React (con Vite) o simplemente HTML/CSS/JS con fetch, priorizando vista móvil.

    Autenticación: JWT + envío de código por correo (usar nodemailer o SendGrid).

    Hosting/Pruebas: localhost + ngrok si quieres probar en móvil.

7. Criterios de aceptación (ejemplo para RF1 – Registro)

RF1 – Registro e inicio de sesión con correo institucional

    El usuario ingresa correo con dominio institucional (ej: @univ.edu).

    Sistema envía un código de 6 dígitos al correo.

    Usuario ingresa código y completa registro.

    Las contraseñas se almacenan hasheadas.

    Inicio de sesión con credenciales correctas devuelve token JWT.

    Credenciales incorrectas muestran error.

Puedes escribir criterios similares para los otros 10 RF.
8. Plan de trabajo sugerido para el segundo parcial

    Diseño de BD (entidades, relaciones, índices) – 1 día

    Backend básico (registro, login, CRUD de viajes, solicitudes) – 3 días

    Lógica de calificaciones y reportes – 2 días

    Frontend mínimo (pantallas: login, listado de viajes, formulario de publicación, perfil) – 3 días

    Integración y pruebas – 2 días

    Administración (panel simple para ver reportes) – 1 día

9. Extras que puedes agregar para destacar

    GPS tracking en vivo (usar WebSocket o actualización cada 10 segundos con ubicación aproximada)

    Notificaciones push (si usas Firebase o similar)

    Exportar trazabilidad (CSV para admin)