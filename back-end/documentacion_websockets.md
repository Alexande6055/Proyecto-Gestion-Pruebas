# Documentación de WebSockets - Sistema U-Ride

Esta sección detalla la comunicación en tiempo real para el flujo de reservas y confirmaciones de viajes.

## 1. Conexión y Autenticación

- **Protocolo**: Socket.io
- **URL**: `ws://localhost:3000`
- **Autenticación**: Se debe enviar el token JWT en el encabezado `Authorization` del handshake.
- **Sala Privada**: Al conectarse, el servidor une automáticamente al cliente a una sala única basada en su ID: `user_{userId}`.

### Ejemplo de conexión (Client-side)
```javascript
const socket = io('http://localhost:3000', {
  extraHeaders: {
    Authorization: `Bearer ${token}`
  },
  query: {
    userId: 'mi-id-de-usuario'
  }
});
```

---

## 2. Eventos de Cliente (Inbound)

Eventos que el Frontend debe emitir hacia el servidor.

### `send_request`
Un pasajero solicita unirse a un viaje.
- **Payload**:
  ```json
  {
    "tripId": "UUID-del-viaje"
  }
  ```
- **Respuesta (Ack)**:
  ```json
  {
    "status": "pending",
    "requestId": "UUID-de-la-solicitud"
  }
  ```

### `manage_request`
Un conductor acepta o rechaza una solicitud pendiente.
- **Payload**:
  ```json
  {
    "requestId": "UUID-de-la-solicitud",
    "status": "aceptada" | "rechazada"
  }
  ```
- **Respuesta (Ack)**:
  ```json
  {
    "status": "aceptada" | "rechazada"
  }
  ```

### `cancel_request`
Un pasajero o el conductor cancelan una reserva (debe tener motivo).
- **Payload**:
  ```json
  {
    "requestId": "UUID-de-la-solicitud",
    "reason": "Motivo de la cancelación"
  }
  ```
- **Respuesta (Ack)**:
  ```json
  {
    "status": "cancelada"
  }
  ```

### `join_trip` / `leave_trip`
Un usuario se une o sale de la sala de un viaje para recibir actualizaciones de ubicación.
- **Payload**:
  ```json
  {
    "tripId": "UUID-del-viaje"
  }
  ```

### `update_trip_location`
Un conductor envía su ubicación actual durante un viaje en curso.
- **Payload**:
  ```json
  {
    "tripId": "UUID-del-viaje",
    "lat": -1.2345,
    "lng": -78.1234
  }
  ```

---

## 3. Eventos de Servidor (Outbound)

Eventos que el Frontend debe escuchar.

### `trip_location_updated`
Notifica a todos los usuarios suscritos al viaje sobre la nueva ubicación del conductor.
- **Escuchar en**: Sala del viaje (`trip_{tripId}`).
- **Payload**:
  ```json
  {
    "tripId": "UUID-del-viaje",
    "lat": -1.2345,
    "lng": -78.1234,
    "timestamp": "2026-05-20T10:00:00Z"
  }
  ```

### `new_request`
Notifica al **conductor** que alguien quiere unirse a su viaje.
- **Escuchar en**: Sala del conductor.
- **Payload**:
  ```json
  {
    "requestId": "UUID-de-la-solicitud",
    "passengerId": "UUID-del-pasajero",
    "tripId": "UUID-del-viaje"
  }
  ```

### `request_updated`
Notifica al **pasajero** que su solicitud ha cambiado de estado.
- **Escuchar en**: Sala del pasajero.
- **Payload**:
  ```json
  {
    "requestId": "UUID-de-la-solicitud",
    "status": "aceptada" | "rechazada" | "cancelada"
  }
  ```

### `request_cancelled`
Notifica a la otra parte que una solicitud ha sido cancelada.
- **Escuchar en**: Sala del usuario afectado.
- **Payload**:
  ```json
  {
    "requestId": "UUID-de-la-solicitud",
    "reason": "Motivo de la cancelación",
    "cancelledBy": "UUID-de-quien-cancelo"
  }
  ```

---

## 4. Flujo de Estados

1. El pasajero emite `send_request`.
2. El servidor valida (cupos, no ser el mismo conductor, etc.).
3. El servidor crea la solicitud en DB con estado `pendiente`.
4. El servidor emite `new_request` al conductor.
5. El conductor emite `manage_request`.
6. El servidor actualiza la DB y, si es `aceptada`, descuenta un cupo del viaje.
7. El servidor emite `request_updated` al pasajero.
