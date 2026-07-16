import { describe, expect, it } from 'vitest';
import {
  llmModelDataV1Schema,
  llmModelDataV2Schema,
  validateCanonicalJson,
} from '../llmModelDataSchema.js';

const canonical = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

describe('LLM model data validation', () => {
  it('accepts canonical v1 and v2 documents', () => {
    const v1 = { 'gpt-test': { input_cost_per_token: 1 } };
    const v2 = {
      openai: {
        name: 'OpenAI',
        models: { 'gpt-test': { id: 'gpt-test', name: 'GPT Test' } },
      },
    };

    expect(
      validateCanonicalJson(canonical(v1), llmModelDataV1Schema)
    ).toEqual(v1);
    expect(
      validateCanonicalJson(canonical(v2), llmModelDataV2Schema)
    ).toEqual(v2);
  });

  it('rejects non-canonical formatting', () => {
    expect(() =>
      validateCanonicalJson('{"gpt-test":{}}\n', llmModelDataV1Schema)
    ).toThrow('canonical two-space JSON');
  });

  it('rejects empty and structurally invalid documents', () => {
    expect(() => validateCanonicalJson('{}\n', llmModelDataV1Schema)).toThrow();

    const invalid = {
      openai: {
        name: 'OpenAI',
        models: { broken: { name: 'Broken' } },
      },
    };
    expect(() =>
      validateCanonicalJson(canonical(invalid), llmModelDataV2Schema)
    ).toThrow();
  });
});
