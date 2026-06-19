import { Issue } from '@bugflow-2026/shared-types';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
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
export class IssuesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join-issues')
  handleJoinIssues(
    @ConnectedSocket() client: Socket,
  ) {
    console.log('JOIN ISSUES', client.id);
    client.join('issues-all');
  }

  @SubscribeMessage('join-project')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ) {
    client.join(`project-${projectId}`);
  }

  handleConnection(client: Socket) {
    console.log('CONNECTED', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('DISCONNECTED', client.id);
  }

  emitIssueUpdated(issue: Issue) {
    this.server.to('issues-all').emit('issue-updated', issue);
    if (issue.projectId) {
      this.server
        .to(`project-${issue.projectId}`)
        .emit('issue-updated', issue);
    }
  }

  emitIssueCreated(issue: Issue) {
    this.server.to('issues-all').emit('issue-created', issue);
    if (issue.projectId) {
      this.server
        .to(`project-${issue.projectId}`)
        .emit('issue-created', issue);
    }
  }

  emitIssueDeleted(issue: Issue) {
    this.server.to('issues-all').emit('issue-deleted', issue.id);
    if (issue.projectId) {
      this.server
        .to(`project-${issue.projectId}`)
        .emit('issue-deleted', issue.id);
    }
  }
}
