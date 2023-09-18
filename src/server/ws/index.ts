import { Server } from 'socket.io';
import { Express } from 'express';
import { createServer } from 'http';

export function initSocketio(app: Express) {
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    // transports: ['websocket'],
  });
}
