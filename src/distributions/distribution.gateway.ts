import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class DistributionGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        console.log('❌ No token, disconnecting');
        return client.disconnect();
      }

      // 🔥 FIX: ensure secret exists
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('❌ JWT_SECRET is not defined');
        return client.disconnect();
      }

      const decoded: any = jwt.verify(token, secret);

      const userId = decoded.sub || decoded.id;

      if (!userId) {
        console.log('❌ Invalid token payload');
        return client.disconnect();
      }

      const room = `user_${userId}`;
      client.join(room);

      console.log(`🔐 User ${userId} authenticated & joined ${room}`);
    } catch (err) {
      console.log('❌ Invalid token, disconnecting');
      client.disconnect();
    }
  }

  // 🔥 SEND UPDATE (USER-SPECIFIC)
  sendUpdateToUser(userId: number, data: any) {
    this.server.to(`user_${userId}`).emit('release:update', data);
  }
}