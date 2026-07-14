import OpenAI from 'openai';

export interface AIGatewayConnectivityClientOptions {
  apiKey: string;
  baseURL?: string;
  maxRetries: 0;
  timeout: 15_000;
}

export interface AIGatewayConnectivityClient {
  models: {
    list(): Promise<{ data: Array<{ id: string }> }>;
  };
  chat: {
    completions: {
      create(input: {
        model: string;
        messages: Array<{ role: 'user'; content: string }>;
        max_tokens: 1;
        stream: false;
      }): Promise<unknown>;
    };
  };
}

export interface TestAIGatewayCustomConnectionInput {
  modelApiKey: string;
  customModelBaseUrl: string | null;
  customModelName: string | null;
}

export interface TestAIGatewayCustomConnectionResult {
  model: string;
  durationMs: number;
}

interface AIGatewayConnectivityDependencies {
  createClient?: (
    options: AIGatewayConnectivityClientOptions
  ) => AIGatewayConnectivityClient;
  now?: () => number;
}

function normalizeOptionalString(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function getSafeErrorMessage(error: unknown, secret: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return secret ? message.split(secret).join('[REDACTED]') : message;
}

export async function testAIGatewayCustomConnection(
  input: TestAIGatewayCustomConnectionInput,
  dependencies: AIGatewayConnectivityDependencies = {}
): Promise<TestAIGatewayCustomConnectionResult> {
  const modelApiKey = input.modelApiKey.trim();
  const createClient =
    dependencies.createClient ??
    ((options: AIGatewayConnectivityClientOptions) => new OpenAI(options));
  const now = dependencies.now ?? Date.now;
  const startedAt = now();

  try {
    const client = createClient({
      apiKey: modelApiKey,
      baseURL: normalizeOptionalString(input.customModelBaseUrl),
      maxRetries: 0,
      timeout: 15_000,
    });

    let model = normalizeOptionalString(input.customModelName);
    if (!model) {
      const models = await client.models.list();
      model = models.data[0]?.id;
    }

    if (!model) {
      throw new Error('No models available from upstream');
    }

    await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Reply with OK.' }],
      max_tokens: 1,
      stream: false,
    });

    return {
      model,
      durationMs: Math.max(0, now() - startedAt),
    };
  } catch (error) {
    throw new Error(getSafeErrorMessage(error, modelApiKey));
  }
}
