import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { jwtVerify } from '../middleware/auth';
import { socketEventBus } from './shared';
import { isUuid } from '../utils/common';

export function initSocketio(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    transports: ['websocket'],
    serveClient: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.of((name, auth, next) => {
    const workspaceId = name.replace(/^\//, '');

    next(null, isUuid(workspaceId)); // or false, when the creation is denied
  })
    .use(async (socket, next) => {
      // Auth
      try {
        const token = socket.handshake.auth['token'];
        if (typeof token !== 'string') {
          throw new Error('Token cannot be empty');
        }

        try {
          const user = jwtVerify(token);

          console.log('[Socket] Authenticated via JWT:', user.username);

          socket.data.user = user;
          socket.data.token = token;

          const workspaceId = socket.nsp.name.replace(/^\//, '');
          socket.data.workspaceId = workspaceId;

          next();
        } catch (err) {
          console.error(err);
          next(new Error('TokenInvalid'));
        }
      } catch (err: any) {
        next(err);
      }
    })
    .on('connection', (socket) => {
      if (!socket.data.user) {
        return;
      }

      socket.onAny((eventName, eventData, callback) => {
        console.log('[Socket] receive:', { eventName, eventData });
        socketEventBus.emit(eventName, eventData, socket, callback);
      });
    });
}
