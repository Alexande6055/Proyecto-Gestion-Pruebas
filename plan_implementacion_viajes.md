# Estado de Implementación: Sistema de Viajes U-Ride

Se ha completado la implementación de las funcionalidades principales para la gestión de viajes, tanto en el Back-end como en el Front-end.

## 1. Back-end (Completado)

### Módulo de Viajes (Trips)
- [x] **Enum TripStatus**: Actualizado para incluir el estado `en_curso`.
- [x] **Listar Viajes**: Endpoint `GET /trips` mejorado con soporte para filtrado por `zona`, `fecha` y `estado`.
- [x] **Editar Viaje**: Endpoint `PATCH /trips/:id` implementado para que el conductor modifique sus viajes (solo si están en estado `abierto`).
- [x] **Eliminar Viaje**: Endpoint `DELETE /trips/:id` implementado para que el conductor cancele sus viajes.
- [x] **Iniciar Viaje**: Endpoint `POST /trips/:id/start` implementado para cambiar el estado a `en_curso`.
- [x] **Finalizar Viaje**: Endpoint `POST /trips/:id/complete` ajustado para validar que el viaje esté `en_curso`.

### Módulo de Solicitudes (Requests)
- [x] **Cancelar Reserva**: Endpoint `POST /requests/:id/cancel` implementado para permitir a pasajeros y conductores cancelar una reserva con un motivo.

---

## 2. Front-end (Completado)

### Servicios (tripsService & requestsService)
- [x] Integración de nuevos endpoints: `update`, `delete`, `start` para viajes y `cancel` para solicitudes.

### Vista de Viajes (TripsView)
- [x] **CRUD Completo**:
    - **Crear**: Formulario funcional.
    - **Editar**: Botón de edición que precarga el formulario (con scroll automático).
    - **Eliminar**: Botón de eliminación con confirmación.
    - **Listar**: Tabla con estados dinámicos y formatos de fecha legibles.
- [x] **Ciclo de Vida**:
    - Botón **Iniciar** para conductores (pasa a `en_curso`).
    - Botón **Finalizar** para conductores (pasa a `finalizado`).
- [x] **Gestión de Reservas (Pasajero)**:
    - Botón **Reservar** visible solo para viajes ajenos y con cupos.
    - Sección **Tu Solicitud** en el detalle del viaje para ver el estado y botón de **Cancelar** si aplica.
- [x] **Gestión de Solicitudes (Conductor)**:
    - Sección **Solicitudes de Pasajeros** en el detalle del viaje.
    - Acciones de **Aceptar** y **Rechazar** solicitudes pendientes.

## 3. Integración de Mapas y Geolocalización (Propuesta)

Para permitir que el origen y destino se seleccionen visualmente y se almacenen coordenadas exactas, se requiere la siguiente evolución del sistema:

### A. Cambios en el Back-end

#### Entidad de Viaje (`Trip`)
- **Nuevas Columnas**: Se deben agregar 4 campos numéricos para precisión decimal:
    - `origen_lat`: decimal (Latitud de origen)
    - `origen_lng`: decimal (Longitud de origen)
    - `destino_lat`: decimal (Latitud de destino)
    - `destino_lng`: decimal (Longitud de destino)
- **DTOs**: Actualizar `CreateTripDto` y `UpdateTripDto` para validar y recibir estos campos.

### B. Cambios en el Front-end

#### Selección de Ubicación (Conductor)
- **Componente MapPicker**: Un mapa interactivo que permite al conductor mover un marcador para fijar el origen y otro para el destino.
- **Geocoding Inverso**: Al seleccionar un punto en el mapa, utilizar la API para obtener el nombre de la zona/calle y llenar automáticamente los campos `origen_zona` y `destino_zona`.

#### Visualización de Ruta (Pasajero)
- **Vista de Detalle**: En lugar de solo texto, mostrar un mini-mapa con una línea (Polyline) que conecte el origen y el destino.
- **Cálculo de Distancia/Tiempo**: (Opcional) Mostrar el tiempo estimado de viaje basado en la ruta.

### C. Proceso de Integración

1.  **Elección de Proveedor**:
    - **Google Maps Platform**: Recomendado para autocompletado de direcciones y mapas familiares, requiere API Key y tarjeta de crédito (tiene cuota gratuita amplia).
    - **Leaflet + OpenStreetMap**: Gratuito y de código abierto. Ideal si no se requiere autocompletado avanzado de Google.
2.  **Configuración de API Key**: Configurar el archivo `.env` tanto en back-end como en front-end.
3.  **Migración de Base de Datos**: Ejecutar la migración para añadir las columnas de coordenadas.
4.  **Implementación de Componentes**:
    - Instalar librerías (ej: `@react-google-maps/api` o `react-leaflet`).
    - Crear el componente `MapContainer` reutilizable.
5.  **Fase Futura: "Estoy Aquí" (Seguimiento Real)**:
    - Al usar el botón "Iniciar Viaje", activar la API de Geolocalización del navegador (`navigator.geolocation.watchPosition`).
    - Emitir las coordenadas del conductor vía WebSockets (`gateway`).
    - Los pasajeros suscritos al viaje verán en tiempo real un icono del vehículo moviéndose hacia el destino.

---

## 4. Próximos Pasos Sugeridos
1. **Implementar Geolocalización**: Iniciar con la adición de campos de coordenadas en la BD.
2. **Calificaciones**: Implementar la lógica para que, una vez finalizado el viaje, el botón de "Calificar" aparezca tanto para el conductor como para los pasajeros.
3. **Notificaciones**: Integrar plenamente los eventos de Socket.io definidos en `documentacion_websockets.md`.
4. **Filtros Avanzados**: Agregar controles de búsqueda por zona y fecha en el Front-end.
