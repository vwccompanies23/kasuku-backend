import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EmailGateway {
  @WebSocketServer()
  server: Server;

  sendStatsUpdate(data: any) {
    this.server.emit('email-stats', data);
  }
}