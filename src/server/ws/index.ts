import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { jwtVerify } from '../middleware/auth.js';
import { socketEventBus } from './shared.js';
import { isCuid } from '../utils/common.js';
import { logger } from '../utils/logger.js';
import { getAuthSession, UserAuthPayload } from '../model/auth.js';
import { verifyUserApiKey } from '../model/user.js';
import { env } from '../utils/env.js';
import { Redis } from 'ioredis';

export function initSocketio(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    transports: ['websocket'],
    serveClient: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Setup Redis adapter if Redis URL is configured
  if (env.cache.redisUrl) {
    try {
      logger.info(
        '[WebSocket] Setting up Redis adapter with URL:',
        env.cache.redisUrl
      );

      const pubClient = new Redis(env.cache.redisUrl);
      const subClient = pubClient.duplicate();

      // Handle Redis connection events
      pubClient.on('error', (err: Error) => {
        logger.error('[WebSocket] Redis pub client error:', err);
      });

      subClient.on('error', (err: Error) => {
        logger.error('[WebSocket] Redis sub client error:', err);
      });

      pubClient.on('connect', () => {
        logger.info('[WebSocket] Redis pub client connected');
      });

      subClient.on('connect', () => {
        logger.info('[WebSocket] Redis sub client connected');
      });

      pubClient.on('close', () => {
        logger.warn('[WebSocket] Redis pub client disconnected');
      });

      subClient.on('close', () => {
        logger.warn('[WebSocket] Redis sub client disconnected');
      });

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('[WebSocket] Redis adapter configured successfully');
    } catch (error) {
      logger.error('[WebSocket] Failed to setup Redis adapter:', error);
      logger.warn('[WebSocket] Falling back to in-memory adapter');
    }
  } else {
    logger.info('[WebSocket] No Redis URL configured, using in-memory adapter');
  }

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
          if (token.startsWith('sk_')) {
            // auth with api key
            const _user = await verifyUserApiKey(token);

            user = {
              id: _user.id,
              username: _user.username,
              role: _user.role,
            };
          } else {
            user = jwtVerify(token);
            logger.info(
              '[WebSocket] Authenticated via JWT:',
              user.id,
              user.username
            );
          }
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
