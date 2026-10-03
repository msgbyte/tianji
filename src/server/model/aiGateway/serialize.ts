import { z } from 'zod';
import type { AIGateway } from '@prisma/client';
import { AIGatewayModelSchema } from '../../prisma/zod/aigateway.js';

export const aiGatewayOutputSchema = AIGatewayModelSchema.omit({
  modelApiKey: true,
}).extend({
  hasModelApiKey: z.boolean(),
});

export function serializeAIGateway({ modelApiKey, ...gateway }: AIGateway) {
  return {
    ...gateway,
    hasModelApiKey: Boolean(modelApiKey),
    customModelInputPrice:
      gateway.customModelInputPrice == null
        ? null
        : Number(gateway.customModelInputPrice),
    customModelOutputPrice:
      gateway.customModelOutputPrice == null
        ? null
        : Number(gateway.customModelOutputPrice),
  };
}
