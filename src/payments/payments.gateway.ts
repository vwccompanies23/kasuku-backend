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
export class PaymentsGateway {
  @WebSocketServer()
  server: Server;

  // 🔥 send update to frontend
  sendUpdate(data: any) {
    this.server.emit('dashboard:update', data);
  }
}