import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { BugFlowNotification } from '@bugflow-2026/shared-types';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:4200',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join-user')
  handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    client.join(`user-${userId}`);
  }

  emitNotificationCreated(
    userId: string,
    notification: BugFlowNotification,
  ) {
    this.server
      .to(`user-${userId}`)
      .emit('notification-created', notification);
  }
}
