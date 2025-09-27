export interface CreditPackDefinition {
  id: string;
  name: string;
  variantId: string;
  credit: number;
  price: number;
  currency?: string;
}

export function parseCreditPacks(
  rawPacks: string | undefined
): CreditPackDefinition[] {
  if (!rawPacks) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawPacks);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        const variantId = String(item.variantId ?? item.id ?? '');
        const credit = Number(item.credit ?? item.amount ?? 0);
        const price = Number(item.price ?? 0);

        if (!variantId || Number.isNaN(credit) || Number.isNaN(price)) {
          return null;
        }

        return {
          id: String(item.id ?? variantId),
          name: String(item.name ?? ''),
          variantId,
          credit,
          price,
          currency: item.currency ? String(item.currency) : undefined,
        };
      })
      .filter(Boolean) as CreditPackDefinition[];
  } catch (error) {
    console.error('Failed to parse LEMON_SQUEEZY_CREDIT_PACKS', error);
    return [];
  }
}
