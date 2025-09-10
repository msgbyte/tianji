import { Prisma } from '@prisma/client';

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
