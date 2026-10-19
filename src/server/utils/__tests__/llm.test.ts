import { describe, it, expect } from 'vitest';
import modelPricesAndContextWindow from '../model_prices_and_context_window.json' with { type: 'json' };

describe('Model Prices and Context Window Configuration', () => {
  // Skip third-party provider models that are managed externally
  const thirdPartyPrefixes = [
    'meta_llama/',
    'bedrock/',
    'together_ai/',
    'snowflake/',
    'featherless_ai/',
    'github_copilot/',
    'gradient_ai/',
    'heroku/',
  ];
  // Pricing varies by region and reasoning mode and cannot be one token pair.
  const variablePricingModels = ['dashscope/qwen3-30b-a3b'];

  it('should ensure chat models have proper pricing fields', () => {
    const models = modelPricesAndContextWindow;
    const modelKeys = Object.keys(models);

    // Skip documentation and routing metadata entries.
    const actualModels = modelKeys.filter((key) => {
      const model = models[key as keyof typeof models];
      return key !== 'sample_spec' && 'litellm_provider' in model;
    });

    expect(actualModels.length).toBeGreaterThan(0);

    const missingPricing: Array<{ model: string; issue: string }> = [];
    const characterPricingModels: Array<string> = [];

    actualModels.forEach((modelKey) => {
      const model = models[modelKey as keyof typeof models];

      const isThirdPartyModel = thirdPartyPrefixes.some((prefix) =>
        modelKey.startsWith(prefix)
      );
      const hasVariablePricing = variablePricingModels.includes(modelKey);

      // Only check for chat and completion models that should have pricing
      const isTextModel =
        !('mode' in model) ||
        model.mode === 'chat' ||
        model.mode === 'completion';

      if (isTextModel && !isThirdPartyModel && !hasVariablePricing) {
        const hasTokenPricing =
          'input_cost_per_token' in model && 'output_cost_per_token' in model;
        const hasCharacterPricing =
          'input_cost_per_character' in model &&
          'output_cost_per_character' in model;
        const hasResourcePricing = Object.entries(model).some(
          ([field, value]) =>
            field.includes('_cost_per_') &&
            ![
              'input_cost_per_token',
              'output_cost_per_token',
              'input_cost_per_character',
              'output_cost_per_character',
            ].includes(field) &&
            typeof value === 'number'
        );
        const hasTieredPricing =
          'tiered_pricing' in model &&
          Array.isArray(model.tiered_pricing) &&
          model.tiered_pricing.length > 0 &&
          model.tiered_pricing.every(
            (tier) =>
              'input_cost_per_token' in tier &&
              'output_cost_per_token' in tier
          );

        if (hasCharacterPricing && !hasTokenPricing) {
          // Model uses character pricing - this is valid but needs conversion
          characterPricingModels.push(modelKey);
        } else if (
          !hasTokenPricing &&
          !hasCharacterPricing &&
          !hasResourcePricing &&
          !hasTieredPricing
        ) {
          // Model has no pricing information at all
          missingPricing.push({
            model: modelKey,
            issue:
              'No pricing information (neither token nor character pricing)',
          });
        } else if (hasTokenPricing) {
          // Model has token pricing - this is preferred
          // No action needed
        }
      }
    });

    // Report issues
    if (missingPricing.length > 0) {
      const errorMessage = missingPricing
        .map(({ model, issue }) => `${model}: ${issue}`)
        .join('\n');

      console.error(
        `❌ Models with missing pricing information:\n${errorMessage}`
      );
    }

    if (characterPricingModels.length > 0) {
      console.warn(
        `⚠️  Models using character pricing (should consider adding token pricing):\n${characterPricingModels.join('\n')}`
      );
    }

    // Fail the test if there are models with no pricing information at all
    if (missingPricing.length > 0) {
      throw new Error(
        `${missingPricing.length} text models are missing pricing information completely`
      );
    }

    // Test passes if we have at least some models and proper pricing structure
    expect(actualModels.length).toBeGreaterThan(0);
  });

  it('should validate that cost fields are numeric values', () => {
    const models = modelPricesAndContextWindow;
    const modelKeys = Object.keys(models).filter(
      (key) => key !== 'sample_spec'
    );

    const invalidCostFields: Array<{
      model: string;
      field: string;
      value: any;
    }> = [];

    modelKeys.forEach((modelKey) => {
      const model = models[modelKey as keyof typeof models];

      if ('input_cost_per_token' in model) {
        const inputCost = model.input_cost_per_token;
        if (
          typeof inputCost !== 'number' ||
          isNaN(inputCost) ||
          inputCost < 0
        ) {
          invalidCostFields.push({
            model: modelKey,
            field: 'input_cost_per_token',
            value: inputCost,
          });
        }
      }

      if ('output_cost_per_token' in model) {
        const outputCost = model.output_cost_per_token;
        if (
          typeof outputCost !== 'number' ||
          isNaN(outputCost) ||
          outputCost < 0
        ) {
          invalidCostFields.push({
            model: modelKey,
            field: 'output_cost_per_token',
            value: outputCost,
          });
        }
      }
    });

    if (invalidCostFields.length > 0) {
      const errorMessage = invalidCostFields
        .map(
          ({ model, field, value }) =>
            `Model "${model}" has invalid ${field}: ${value} (should be a non-negative number)`
        )
        .join('\n');

      throw new Error(
        `The following models have invalid cost field values:\n${errorMessage}`
      );
    }

    expect(invalidCostFields).toHaveLength(0);
  });

  it('should verify that getLLMCostDecimal function works correctly with the model data', async () => {
    // Import the function we're testing
    const { getLLMCostDecimal } = await import('../llm.js');

    // Test with a known model that should exist
    const testModel = 'gpt-4';
    const inputTokens = 1000;
    const outputTokens = 500;

    const cost = getLLMCostDecimal(testModel, inputTokens, outputTokens);

    // The cost should be a Prisma.Decimal and should be greater than 0 for a real model
    expect(cost).toBeDefined();
    expect(cost.toNumber()).toBeGreaterThan(0);
  });

  it('should return 0 cost for unknown models', async () => {
    const { getLLMCostDecimal } = await import('../llm.js');

    const unknownModel = 'non-existent-model-12345';
    const inputTokens = 1000;
    const outputTokens = 500;

    const cost = getLLMCostDecimal(unknownModel, inputTokens, outputTokens);

    // Should return 0 for unknown models
    expect(cost.toNumber()).toBe(0);
  });
});
