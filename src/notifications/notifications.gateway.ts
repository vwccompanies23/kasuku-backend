import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  // =========================
  // 🔔 SEND TO USER
  // =========================
  sendToUser(userId: number, event: string, data: any) {
    if (!this.server) return;

    this.server.emit(`user_${userId}`, {
      event,
      data,
    });

    console.log(`🔔 Notify user ${userId}`, data);
  }

  // =========================
  // 🔥 REALTIME EARNINGS EVENT
  // =========================
  @OnEvent('earnings.created')
  handleRealtimeEarnings(payload: {
    userId: number;
    amount: number;
  }) {
    if (!payload?.userId) return;

    this.sendToUser(payload.userId, 'earnings', {
      amount: payload.amount,
      message: `🔥 You earned $${payload.amount}`,
    });
  }
}