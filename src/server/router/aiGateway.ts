import { Router } from 'express';
import { buildOpenAIHandler } from '../model/aiGateway.js';

export const aiGatewayRouter = Router();

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/openai/v1/chat/completions',
  buildOpenAIHandler({})
);

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/deepseek/v1/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://api.deepseek.com',
    modelPriceName: (model) => {
      if (model.startsWith('deepseek/')) {
        return model;
      }

      return `deepseek/${model}`;
    },
  })
);

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/anthropic/v1/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://api.anthropic.com/v1/',
  })
);

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/openrouter/v1/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://openrouter.ai/api/v1',
    modelPriceName: (model) => {
      if (model.startsWith('openrouter/')) {
        return model;
      }

      if (model.includes('deepseek-chat')) {
        return `openrouter/deepseek/deepseek-chat`;
      }

      if (model.includes('deepseek-coder')) {
        return `openrouter/deepseek/deepseek-coder`;
      }

      if (model.includes('deepseek-r1')) {
        return `openrouter/deepseek/deepseek-r1`;
      }

      return `openrouter/${model}`;
    },
  })
);

aiGatewayRouter.post(
  '/:workspaceId/:gatewayId/custom/v1/chat/completions',
  buildOpenAIHandler({
    isCustomRoute: true,
  })
);

//#region Alias should be remove in future
aiGatewayRouter.post(
  '/v1/:workspaceId/:gatewayId/openai/chat/completions',
  buildOpenAIHandler({})
);

aiGatewayRouter.post(
  '/v1/:workspaceId/:gatewayId/deepseek/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://api.deepseek.com',
    modelPriceName: (model) => {
      if (model.startsWith('deepseek/')) {
        return model;
      }

      return `deepseek/${model}`;
    },
  })
);

aiGatewayRouter.post(
  '/v1/:workspaceId/:gatewayId/anthropic/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://api.anthropic.com/v1/',
  })
);

aiGatewayRouter.post(
  '/v1/:workspaceId/:gatewayId/openrouter/chat/completions',
  buildOpenAIHandler({
    baseUrl: 'https://openrouter.ai/api/v1',
    modelPriceName: (model) => {
      if (model.startsWith('openrouter/')) {
        return model;
      }

      if (model.includes('deepseek-chat')) {
        return `openrouter/deepseek/deepseek-chat`;
      }

      if (model.includes('deepseek-coder')) {
        return `openrouter/deepseek/deepseek-coder`;
      }

      if (model.includes('deepseek-r1')) {
        return `openrouter/deepseek/deepseek-r1`;
      }

      return `openrouter/${model}`;
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
