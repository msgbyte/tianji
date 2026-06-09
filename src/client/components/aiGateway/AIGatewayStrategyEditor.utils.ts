export interface AIGatewayPricingRow {
  inputTokenMin: number;
  inputTokenMax: number | null;
  input: number | null;
  output: number | null;
  cacheRead: number | null;
  cacheWrite?: number | null;
}

type StrategyObject = Record<string, unknown>;

export interface AIGatewayModelPricingCost {
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
  context_over_200k?: AIGatewayModelPricingCost;
}

export function isStrategyRecord(value: unknown): value is StrategyObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStrategyText(
  value: string | null | undefined
): StrategyObject | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = JSON.parse(value);

  if (!isStrategyRecord(parsed)) {
    throw new Error('Strategy must be a JSON object');
  }

  return parsed;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function readPriceNumber(price: StrategyObject, keys: string[]) {
  for (const key of keys) {
    if (key in price) {
      return toNullableNumber(price[key]);
    }
  }

  return null;
}

function normalizePricingRow(price: StrategyObject): AIGatewayPricingRow {
  const row: AIGatewayPricingRow = {
    inputTokenMin:
      readPriceNumber(price, [
        'inputTokenMin',
        'inputTokenStart',
        'minInputToken',
      ]) ?? 0,
    inputTokenMax: readPriceNumber(price, [
      'inputTokenMax',
      'inputTokenEnd',
      'maxInputToken',
    ]),
    input: readPriceNumber(price, ['input']),
    output: readPriceNumber(price, ['output']),
    cacheRead: readPriceNumber(price, ['cacheRead', 'cache_read']),
  };

  if ('cacheWrite' in price || 'cache_write' in price) {
    row.cacheWrite = readPriceNumber(price, ['cacheWrite', 'cache_write']);
  }

  return row;
}

function buildPricingRowFromModelCost(
  cost: AIGatewayModelPricingCost,
  inputTokenMin: number,
  inputTokenMax: number | null
): AIGatewayPricingRow {
  const row: AIGatewayPricingRow = {
    inputTokenMin,
    inputTokenMax,
    input: toNullableNumber(cost.input),
    output: toNullableNumber(cost.output),
    cacheRead: toNullableNumber(cost.cache_read),
  };

  if (cost.cache_write !== undefined) {
    row.cacheWrite = toNullableNumber(cost.cache_write);
  }

  return row;
}

export function buildPricingRowsFromModelCost(
  cost: AIGatewayModelPricingCost | null | undefined
): AIGatewayPricingRow[] {
  if (!cost) {
    return [];
  }

  if (cost.context_over_200k) {
    return [
      buildPricingRowFromModelCost(cost, 0, 200000),
      buildPricingRowFromModelCost(cost.context_over_200k, 200001, null),
    ];
  }

  return [buildPricingRowFromModelCost(cost, 0, null)];
}

export function parsePricingRowsFromStrategyText(
  value: string | null | undefined
): AIGatewayPricingRow[] {
  const strategy = parseStrategyText(value);

  if (!strategy) {
    return [];
  }

  const price = strategy.price;

  if (Array.isArray(price)) {
    return price.filter(isStrategyRecord).map(normalizePricingRow);
  }

  if (isStrategyRecord(price)) {
    return [normalizePricingRow(price)];
  }

  return [];
}

function serializePricingRow(row: AIGatewayPricingRow): StrategyObject {
  const price: StrategyObject = {
    inputTokenMin: row.inputTokenMin,
    inputTokenMax: row.inputTokenMax,
  };

  if (row.input !== null) {
    price.input = row.input;
  }

  if (row.output !== null) {
    price.output = row.output;
  }

  if (row.cacheRead !== null) {
    price.cacheRead = row.cacheRead;
  }

  if (row.cacheWrite !== undefined && row.cacheWrite !== null) {
    price.cacheWrite = row.cacheWrite;
  }

  return price;
}

export function buildStrategyTextFromPricingRows(
  rows: AIGatewayPricingRow[],
  currentValue: string | null | undefined
): string {
  const current = parseStrategyText(currentValue) ?? {};

  if (rows.length === 0) {
    delete current.price;
  } else {
    current.price = rows.map(serializePricingRow);
  }

  if (Object.keys(current).length === 0) {
    return '';
  }

  return JSON.stringify(current, null, 2);
}

export function isValidAIGatewayStrategyText(
  value: string | null | undefined
): boolean {
  try {
    parseStrategyText(value);
    return true;
  } catch {
    return false;
  }
}

export function getAIGatewayStrategyTextError(
  value: string | null | undefined
): string {
  try {
    parseStrategyText(value);
    return '';
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid JSON';
  }
}

export function parseAIGatewayCustomModelStrategy(
  value: string | null | undefined
): Record<string, any> | null {
  if (!value?.trim()) {
    return null;
  }

  return JSON.parse(value);
}

export function stringifyAIGatewayCustomModelStrategy(value: unknown): string {
  if (!isStrategyRecord(value)) {
    return '';
  }

  return JSON.stringify(value, null, 2);
}
