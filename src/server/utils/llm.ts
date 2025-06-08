import { Prisma } from '@prisma/client';

const contextWindows = await import('./model_prices_and_context_window.json', {
  with: { type: 'json' },
}).then((res) => res.default);

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
