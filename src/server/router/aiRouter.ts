import { Router } from 'express';
import {
  buildAIRouterAnthropicMessagesHandler,
  buildAIRouterOpenAIChatHandler,
  buildAIRouterOpenAIResponsesHandler,
} from '../model/aiRouter.js';

export const aiRouterRouter = Router();

aiRouterRouter.post(
  '/:workspaceId/:routerId/openai/v1/chat/completions',
  buildAIRouterOpenAIChatHandler()
);

aiRouterRouter.post(
  '/:workspaceId/:routerId/openai/v1/responses',
  buildAIRouterOpenAIResponsesHandler()
);

aiRouterRouter.post(
  '/:workspaceId/:routerId/deepseek/v1/chat/completions',
  buildAIRouterOpenAIChatHandler()
);

aiRouterRouter.post(
  '/:workspaceId/:routerId/anthropic/v1/chat/completions',
  buildAIRouterOpenAIChatHandler()
);

aiRouterRouter.post(
  '/:workspaceId/:routerId/openrouter/v1/chat/completions',
  buildAIRouterOpenAIChatHandler()
);

aiRouterRouter.post(
  '/:workspaceId/:routerId/custom/v1/chat/completions',
  buildAIRouterOpenAIChatHandler()
);

aiRouterRouter.post(
  '/:workspaceId/:routerId/custom/v1/responses',
  buildAIRouterOpenAIResponsesHandler()
);

aiRouterRouter.post(
  '/:workspaceId/:routerId/anthropic/v1/messages',
  buildAIRouterAnthropicMessagesHandler()
);

aiRouterRouter.post(
  '/:workspaceId/:routerId/openrouter/v1/messages',
  buildAIRouterAnthropicMessagesHandler()
);

aiRouterRouter.post(
  '/:workspaceId/:routerId/custom/v1/messages',
  buildAIRouterAnthropicMessagesHandler()
);
