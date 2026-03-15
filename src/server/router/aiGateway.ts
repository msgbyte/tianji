import { Router } from 'express';
import {
  buildOpenAIHandler,
  buildAnthropicHandler,
} from '../model/aiGateway.js';

export const aiGatewayRouter = Router();

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/openai/v1/chat/completions',
  buildOpenAIHandler({
    modelProvider: 'openai',
  })
);

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/deepseek/v1/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://api.deepseek.com',
    modelProvider: 'deepseek',
  })
);

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/anthropic/v1/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://api.anthropic.com/v1/',
    modelProvider: 'anthropic',
  })
);

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/openrouter/v1/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://openrouter.ai/api/v1',
    modelProvider: 'openrouter',
    header: (req) => {
      return {
        'HTTP-Referer': req.headers['HTTP-Referer']
          ? String(req.headers['HTTP-Referer'])
          : 'https://tianji.dev/',
        'X-Title': req.headers['X-Title']
          ? String(req.headers['X-Title'])
          : 'Tianji',
      };
    },
  })
);

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/custom/v1/chat/completions',
  buildOpenAIHandler({
    isCustomRoute: true,
  })
);

//#region Anthropic Messages API format (/v1/messages)
aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/anthropic/v1/messages',
  buildAnthropicHandler({
    baseUrl: 'https://api.anthropic.com/v1',
    modelProvider: 'anthropic',
  })
);

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/openrouter/v1/messages',
  buildAnthropicHandler({
    baseUrl: 'https://openrouter.ai/api/v1',
    modelProvider: 'openrouter',
    header: (req) => {
      return {
        'HTTP-Referer': req.headers['HTTP-Referer']
          ? String(req.headers['HTTP-Referer'])
          : 'https://tianji.dev/',
        'X-Title': req.headers['X-Title']
          ? String(req.headers['X-Title'])
          : 'Tianji',
      };
    },
  })
);

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/custom/v1/messages',
  buildAnthropicHandler({
    isCustomRoute: true,
  })
);
//#endregion

//#region Alias should be remove in future
aiGatewayRouter.post(
  '/v1/:workspaceId/:gatewayId/openai/chat/completions',
  buildOpenAIHandler({
    modelProvider: 'openai',
  })
);

aiGatewayRouter.post(
  '/v1/:workspaceId/:gatewayId/deepseek/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://api.deepseek.com',
    modelProvider: 'deepseek',
  })
);

aiGatewayRouter.post(
  '/v1/:workspaceId/:gatewayId/anthropic/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://api.anthropic.com/v1/',
    modelProvider: 'anthropic',
  })
);

aiGatewayRouter.post(
  '/v1/:workspaceId/:gatewayId/openrouter/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://openrouter.ai/api/v1',
    modelProvider: 'openrouter',
    header: (req) => {
      return {
        'HTTP-Referer': req.headers['HTTP-Referer']
          ? String(req.headers['HTTP-Referer'])
          : 'https://tianji.dev/',
        'X-Title': req.headers['X-Title']
          ? String(req.headers['X-Title'])
          : 'Tianji',
      };
    },
  })
);

aiGatewayRouter.post(
  '/v1/:workspaceId/:gatewayId/custom/chat/completions',
  buildOpenAIHandler({
    isCustomRoute: true,
  })
);
//#endregion
