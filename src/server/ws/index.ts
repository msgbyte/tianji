import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { jwtVerify } from '../middleware/auth.js';
import { socketEventBus } from './shared.js';
import { isCuid } from '../utils/common.js';
import { logger } from '../utils/logger.js';
import { getAuthSession, UserAuthPayload } from '../model/auth.js';

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

    next(null, isCuid(workspaceId)); // or false, when the creation is denied
  })
    .use(async (socket, next) => {
      // Auth
      try {
        const token = socket.handshake.auth['token'];
        let user: UserAuthPayload;

        if (token) {
          user = jwtVerify(token);
          logger.info(
            '[WebSocket] Authenticated via JWT:',
            user.id,
            user.username
          );
        } else {
          const session = await getAuthSession(
            socket.request,
            socket.handshake.secure
          );
          if (!session) {
            throw new Error('Can not get user info.');
          }

          user = {
            id: session.user.id,
            username: session.user.name,
            role: session.user.role,
          };
          logger.info(
            '[WebSocket] Authenticated via Session:',
            user.id,
            user.username
          );
        }

        socket.data.user = user;
        socket.data.token = token;

        const workspaceId = socket.nsp.name.replace(/^\//, '');
        socket.data.workspaceId = workspaceId;

        next();
      } catch (err: any) {
        console.error('[Socket] Authenticated throw error:', err);
        next(err);
      }
    })
    .on('connection', (socket) => {
      if (!socket.data.user) {
        return;
      }

      socket.onAny((eventName, eventData, callback) => {
        // console.log('[Socket] receive:', { eventName, eventData });
        socketEventBus.emit(eventName, eventData, socket, callback);
      });
    });
}
