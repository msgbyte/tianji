import { Prisma } from '@prisma/client';
import axios from 'axios';

const contextWindows = await import('./model_prices_and_context_window.json', {
  with: { type: 'json' },
}).then((res) => res.default);

const contextWindowsV2 = await import(
  './model_prices_and_context_window_v2.json',
  {
    with: { type: 'json' },
  }
).then((res) => res.default);

/**
 * @deprecated please use v2
 */
export function getLLMCostDecimal(
  model: string,
  inputToken: number,
  outputToken: number
): Prisma.Decimal {
  const input = new Prisma.Decimal(inputToken);
  const output = new Prisma.Decimal(outputToken);

  const contextWindow = contextWindows[model as keyof typeof contextWindows];

  if (!contextWindow) {
    // if can not found this model in contextWindows, return -1 to indicate this model is not supported
    return new Prisma.Decimal(0);
  }

  if (
    'input_cost_per_token' in contextWindow &&
    'output_cost_per_token' in contextWindow
  ) {
    return input
      .mul(contextWindow.input_cost_per_token)
      .add(output.mul(contextWindow.output_cost_per_token));
  } else {
    return new Prisma.Decimal(0);
  }
}

/**
 * Get LLM cost using v2 configuration with provider support
 * @param provider - The provider name (e.g., 'deepseek', 'xai', 'openai')
 * @param model - The model name (e.g., 'deepseek-chat', 'grok-3-mini-latest')
 * @param inputToken - Number of input tokens
 * @param outputToken - Number of output tokens
 * @returns Prisma.Decimal representing the total cost
 */
export function getLLMCostDecimalV2(
  provider: string,
  model: string,
  inputToken: number,
  outputToken: number
): Prisma.Decimal {
  const input = new Prisma.Decimal(inputToken);
  const output = new Prisma.Decimal(outputToken);

  // Get provider data
  const providerData =
    contextWindowsV2[provider as keyof typeof contextWindowsV2];

  if (!providerData || !providerData.models) {
    // if can not found this provider in contextWindowsV2, return 0 to indicate this provider is not supported
    return new Prisma.Decimal(0);
  }

  // Get model data from provider
  const modelData = providerData.models[
    model as keyof typeof providerData.models
  ] as any;

  if (!modelData || !modelData.cost) {
    // if can not found this model in provider models, return 0 to indicate this model is not supported
    return new Prisma.Decimal(0);
  }

  const cost = modelData.cost;

  if (typeof cost.input === 'number' && typeof cost.output === 'number') {
    // Convert from per million tokens to per token (assuming the cost is per million tokens)
    return input
      .mul(cost.input)
      .div(1_000_000)
      .add(output.mul(cost.output).div(1_000_000));
  } else {
    return new Prisma.Decimal(0);
  }
}

export function getLLMCostDecimalWithCustomPrice(
  inputToken: number,
  outputToken: number,
  customInputPrice: Prisma.Decimal | null | undefined,
  customOutputPrice: Prisma.Decimal | null | undefined
): Prisma.Decimal {
  return (
    customInputPrice
      ? new Prisma.Decimal(customInputPrice).mul(inputToken).div(1_000_000)
      : new Prisma.Decimal(0)
  ).add(
    customOutputPrice
      ? new Prisma.Decimal(customOutputPrice).mul(outputToken).div(1_000_000)
      : new Prisma.Decimal(0)
  );
}

//#region open router
export interface OpenRouterPricing {
  prompt: string;
  completion: string;
  request: string;
  image: string;
  image_output: string;
  web_search: string;
  internal_reasoning: string;
  input_cache_read?: string;
  discount: number;
}

export interface OpenRouterArchitecture {
  tokenizer: string;
  instruct_type: string | null;
  modality: string;
  input_modalities: string[];
  output_modalities: string[];
}

export interface OpenRouterEndpoint {
  name: string;
  model_name: string;
  context_length: number;
  pricing: OpenRouterPricing;
  provider_name: string;
  tag: string;
  quantization: string | null;
  max_completion_tokens: number | null;
  max_prompt_tokens: number | null;
  supported_parameters: string[];
  status: number;
  uptime_last_30m: number | null;
  supports_implicit_caching: boolean;
}

export interface OpenRouterModelData {
  id: string;
  name: string;
  created: number;
  description: string;
  architecture: OpenRouterArchitecture;
  endpoints: OpenRouterEndpoint[];
}

export interface OpenRouterResponse {
  data: OpenRouterModelData;
}

const openRouterRequestCache = new Map<string, Promise<OpenRouterResponse>>();
function fetchOpenrouterEndpoints(model: string): Promise<OpenRouterResponse> {
  if (openRouterRequestCache.has(model)) {
    return openRouterRequestCache.get(model)!;
  }

  const promise = axios
    .get(`https://openrouter.ai/api/v1/models/${model}/endpoints`)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      openRouterRequestCache.delete(model); // remove cache its fetch failed

      throw error;
    });
  openRouterRequestCache.set(model, promise);

  return promise;
}
export async function getOpenRouterPrice(
  model: string,
  openrouterProviderName: string
) {
  const endpoints = await fetchOpenrouterEndpoints(model);

  const endpoint = endpoints.data.endpoints.find(
    (endpoint) => endpoint.provider_name === openrouterProviderName
  );

  if (!endpoint) {
    return { input: new Prisma.Decimal(0), output: new Prisma.Decimal(0) };
  }

  return {
    input: new Prisma.Decimal(endpoint.pricing.prompt),
    output: new Prisma.Decimal(endpoint.pricing.completion),
  };
}

export async function getOpenRouterCostDecimal(
  model: string,
  openrouterProviderName: string,
  inputToken: number,
  outputToken: number
) {
  const { input, output } = await getOpenRouterPrice(
    model,
    openrouterProviderName
  );

  return input.mul(inputToken).add(output.mul(outputToken));
}
// endregion
