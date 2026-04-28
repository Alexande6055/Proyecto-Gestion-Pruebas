import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { RequestsService } from './requests.service';
import { RequestStatus } from './entities/request.entity';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class RequestsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly requestsService: RequestsService) {}

  handleConnection(client: Socket) {
    // Al conectarse, unimos al usuario a una sala con su ID para notificaciones privadas
    const userId = client.handshake.query.userId;
    if (userId) {
      client.join(`user_${userId}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_request')
  async handleSendRequest(
    @MessageBody() data: { tripId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client['user'];
    const request = await this.requestsService.createRequest(data.tripId, user.userId);
    
    // Notificar al conductor en tiempo real
    this.server.to(`user_${request.viaje.conductorId}`).emit('new_request', {
      requestId: request.id,
      passengerId: user.userId,
      tripId: data.tripId,
    });

    return { status: 'pending', requestId: request.id };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('manage_request')
  async handleManageRequest(
    @MessageBody() data: { requestId: string; status: RequestStatus },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client['user'];
    const updatedRequest = await this.requestsService.updateStatus(
      data.requestId,
      user.userId,
      data.status,
    );

    // Notificar al pasajero sobre el resultado
    this.server.to(`user_${updatedRequest.pasajeroId}`).emit('request_updated', {
      requestId: updatedRequest.id,
      status: updatedRequest.estado,
    });

    return { status: updatedRequest.estado };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('cancel_request')
  async handleCancelRequest(
    @MessageBody() data: { requestId: string; reason: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client['user'];
    const cancelledRequest = await this.requestsService.cancelRequest(
      data.requestId,
      user.userId,
      data.reason,
    );

    // Notificar a la otra parte
    const targetId =
      user.userId === cancelledRequest.pasajeroId
        ? cancelledRequest.viaje.conductorId
        : cancelledRequest.pasajeroId;

    this.server.to(`user_${targetId}`).emit('request_cancelled', {
      requestId: cancelledRequest.id,
      reason: data.reason,
      cancelledBy: user.userId,
    });

    return { status: 'cancelada' };
  }
}
