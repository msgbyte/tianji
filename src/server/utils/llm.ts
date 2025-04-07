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

  const contextWindow =
    contextWindows[model as keyof typeof contextWindows] ??
    contextWindows['gpt-4o-mini'];

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
