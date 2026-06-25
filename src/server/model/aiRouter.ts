import { AIRouterLogsStatus, type Prisma } from '@prisma/client';
import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import OpenAI from 'openai';
import { z } from 'zod';
import {
  anthropicRequestSchema,
  buildAnthropicHandler,
  buildOpenAIHandler,
  buildOpenAIResponsesHandler,
  getAIGatewayErrorStatusCode,
  openaiRequestSchema,
  openaiResponsesRequestSchema,
  setAIGatewayStreamHeaders,
  startAIGatewayStreamKeepAlive,
  writeAIGatewayAnthropicStreamError,
} from './aiGateway.js';
import type { AIGatewayLogAwareRequest } from './aiGateway.js';
import { prisma } from './_client.js';
import { logger } from '../utils/logger.js';
import { verifyUserApiKey } from './user.js';

export const AI_ROUTER_PROTOCOLS = {
  OPENAI_CHAT: 'openai-chat',
  OPENAI_RESPONSES: 'openai-responses',
  ANTHROPIC_MESSAGES: 'anthropic-messages',
} as const;

export type AIRouterProtocol =
  (typeof AI_ROUTER_PROTOCOLS)[keyof typeof AI_ROUTER_PROTOCOLS];

export const AI_ROUTER_PROVIDER_VALUES = [
  'openai',
  'deepseek',
  'anthropic',
  'openrouter',
  'custom',
] as const;

export type AIRouterProvider = (typeof AI_ROUTER_PROVIDER_VALUES)[number];

const openAIChatProviders = new Set([
  'openai',
  'deepseek',
  'anthropic',
  'openrouter',
  'custom',
]);
const openAIResponsesProviders = new Set(['openai', 'custom']);
const anthropicMessagesProviders = new Set([
  'anthropic',
  'openrouter',
  'custom',
]);
const aiRouterProtocolValues = new Set<string>(
  Object.values(AI_ROUTER_PROTOCOLS)
);
const aiRouterProviderValues = new Set<string>(AI_ROUTER_PROVIDER_VALUES);

export function isAIRouterProtocol(
  protocol: string
): protocol is AIRouterProtocol {
  return aiRouterProtocolValues.has(protocol);
}

export function isAIRouterProvider(
  provider: string
): provider is AIRouterProvider {
  return aiRouterProviderValues.has(provider);
}

export function getAIRouterProtocolForPath(
  provider: string,
  endpoint: string
): AIRouterProtocol | null {
  if (endpoint === 'chat/completions' && openAIChatProviders.has(provider)) {
    return AI_ROUTER_PROTOCOLS.OPENAI_CHAT;
  }

  if (endpoint === 'responses' && openAIResponsesProviders.has(provider)) {
    return AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES;
  }

  if (endpoint === 'messages' && anthropicMessagesProviders.has(provider)) {
    return AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES;
  }

  return null;
}

export function applyAIRouterModelOverride<T extends { model?: unknown }>(
  payload: T,
  modelOverride?: string | null
): T {
  if (
    modelOverride === undefined ||
    modelOverride === null ||
    modelOverride === ''
  ) {
    return { ...payload };
  }

  return {
    ...payload,
    model: modelOverride,
  };
}

export interface AIRouterGatewayEligibility {
  id?: string;
  modelApiKey?: string | null;
  customModelBaseUrl?: string | null;
}

export interface AIRouterNodeEligibility {
  enabled: boolean;
  order: number;
  provider?: string | null;
  weight?: number | null;
  gateway: AIRouterGatewayEligibility | null;
}

export function isAIRouterNodeEligibleForProtocol(
  node: AIRouterNodeEligibility,
  protocol: string
): boolean {
  const modelProvider = getAIRouterNodeProvider(node);

  return (
    isAIRouterProtocol(protocol) &&
    Boolean(node.enabled) &&
    Boolean(node.gateway?.modelApiKey?.trim()) &&
    isAIRouterLegacyGatewayProtocolAllowed(node, protocol) &&
    Boolean(
      resolveAIRouterGatewayHandlerConfig({
        protocol,
        modelProvider,
      })
    )
  );
}

export function isAIGatewayEligibleForAIRouter(
  gateway: AIRouterGatewayEligibility | null | undefined
): boolean {
  return Boolean(gateway?.modelApiKey?.trim());
}

function getAIRouterNodeProvider(
  node: AIRouterNodeEligibility
): string | null {
  const provider = node.provider?.trim();

  if (provider) {
    return provider;
  }

  return getLegacyAIRouterGatewayMetadata(node.gateway).modelProvider;
}

function isAIRouterLegacyGatewayProtocolAllowed(
  node: AIRouterNodeEligibility,
  protocol: string
) {
  if (node.provider?.trim()) {
    return true;
  }

  const modelProtocols = getLegacyAIRouterGatewayMetadata(
    node.gateway
  ).modelProtocols;

  return modelProtocols.length === 0 || modelProtocols.includes(protocol);
}

function getLegacyAIRouterGatewayMetadata(
  gateway: AIRouterGatewayEligibility | null | undefined
): {
  modelProvider: string | null;
  modelProtocols: string[];
} {
  const legacyGateway = gateway as
    | (AIRouterGatewayEligibility & {
        modelProvider?: string | null;
        modelProtocols?: string[] | null;
      })
    | null
    | undefined;

  return {
    modelProvider: legacyGateway?.modelProvider?.trim() || null,
    modelProtocols: legacyGateway?.modelProtocols ?? [],
  };
}

export function selectEligibleAIRouterNodes<T extends AIRouterNodeEligibility>(
  nodes: T[],
  protocol: string
): T[] {
  return nodes
    .filter((node) => isAIRouterNodeEligibleForProtocol(node, protocol))
    .sort((a, b) => a.order - b.order);
}

export function selectAIRouterTierAttemptNodes<
  T extends AIRouterNodeEligibility,
>(
  nodes: T[],
  protocol: string,
  random = Math.random
): T[] {
  const eligibleNodes = selectEligibleAIRouterNodes(nodes, protocol);

  return orderNodesByWeightedRandom(eligibleNodes, random);
}

function orderNodesByWeightedRandom<T extends AIRouterNodeEligibility>(
  nodes: T[],
  random: () => number
): T[] {
  const remaining = [...nodes];
  const ordered: T[] = [];

  while (remaining.length > 0) {
    const totalWeight = remaining.reduce(
      (sum, node) => sum + normalizeAIRouterNodeWeight(node.weight),
      0
    );

    if (totalWeight <= 0) {
      ordered.push(...remaining.sort((a, b) => a.order - b.order));
      break;
    }

    const target = random() * totalWeight;
    let cursor = 0;
    let selectedIndex = remaining.length - 1;

    for (let i = 0; i < remaining.length; i += 1) {
      cursor += normalizeAIRouterNodeWeight(remaining[i].weight);

      if (target < cursor) {
        selectedIndex = i;
        break;
      }
    }

    const [selectedNode] = remaining.splice(selectedIndex, 1);
    ordered.push(selectedNode);
  }

  return ordered;
}

function normalizeAIRouterNodeWeight(weight: number | null | undefined) {
  if (typeof weight !== 'number' || !Number.isFinite(weight)) {
    return 100;
  }

  return Math.max(0, Math.round(weight));
}

export interface AIRouterFailure {
  statusCode?: number;
  errorType?: 'network' | 'timeout' | 'unknown';
  retryableStatusCodes?: number[];
}

const DEFAULT_RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export function isAIRouterRetryableFailure({
  statusCode,
  errorType,
  retryableStatusCodes,
}: AIRouterFailure): boolean {
  if (errorType === 'network' || errorType === 'timeout') {
    return true;
  }

  if (typeof statusCode !== 'number') {
    return false;
  }

  if (DEFAULT_RETRYABLE_STATUS_CODES.has(statusCode)) {
    return true;
  }

  return retryableStatusCodes?.includes(statusCode) ?? false;
}

interface AIRouterHandlerOptions {
  baseUrl?: string;
  modelProvider?: string;
  isCustomRoute?: boolean;
  header?: (req: Request) => Record<string, string>;
}

type AIRouterRuntimeAttemptRunner = (
  args: RunAIRouterAttemptsArgs
) => Promise<{
  result: AIRouterAttemptResult | null;
  finalResult: AIRouterAttemptResult | null;
  log: unknown;
  attempts: AIRouterAttemptSummary[];
}>;

interface AIRouterRuntimeHandlerOptions {
  runAttempts?: AIRouterRuntimeAttemptRunner;
}

export type AIRouterGatewayHandlerBuilder =
  | 'openai-chat'
  | 'openai-responses'
  | 'anthropic-messages';

export interface AIRouterGatewayHandlerConfig {
  builder: AIRouterGatewayHandlerBuilder;
  options: AIRouterHandlerOptions;
}

export function resolveAIRouterGatewayHandlerConfig(args: {
  protocol: string;
  modelProvider?: string | null;
}): AIRouterGatewayHandlerConfig | null {
  const modelProvider = args.modelProvider?.trim();

  if (!isAIRouterProtocol(args.protocol) || !modelProvider) {
    return null;
  }

  if (args.protocol === AI_ROUTER_PROTOCOLS.OPENAI_CHAT) {
    if (modelProvider === 'openai') {
      return {
        builder: 'openai-chat',
        options: {
          modelProvider: 'openai',
        },
      };
    }

    if (modelProvider === 'deepseek') {
      return {
        builder: 'openai-chat',
        options: {
          baseUrl: 'https://api.deepseek.com',
          modelProvider: 'deepseek',
        },
      };
    }

    if (modelProvider === 'anthropic') {
      return {
        builder: 'openai-chat',
        options: {
          baseUrl: 'https://api.anthropic.com/v1/',
          modelProvider: 'anthropic',
        },
      };
    }

    if (modelProvider === 'openrouter') {
      return {
        builder: 'openai-chat',
        options: {
          baseUrl: 'https://openrouter.ai/api/v1',
          modelProvider: 'openrouter',
          header: buildOpenRouterHeaders,
        },
      };
    }

    if (modelProvider === 'custom') {
      return {
        builder: 'openai-chat',
        options: {
          isCustomRoute: true,
        },
      };
    }
  }

  if (args.protocol === AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES) {
    if (modelProvider === 'openai') {
      return {
        builder: 'openai-responses',
        options: {
          modelProvider: 'openai',
        },
      };
    }

    if (modelProvider === 'custom') {
      return {
        builder: 'openai-responses',
        options: {
          isCustomRoute: true,
        },
      };
    }
  }

  if (args.protocol === AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES) {
    if (modelProvider === 'anthropic') {
      return {
        builder: 'anthropic-messages',
        options: {
          baseUrl: 'https://api.anthropic.com/v1',
          modelProvider: 'anthropic',
        },
      };
    }

    if (modelProvider === 'openrouter') {
      return {
        builder: 'anthropic-messages',
        options: {
          baseUrl: 'https://openrouter.ai/api/v1',
          modelProvider: 'openrouter',
          header: buildOpenRouterHeaders,
        },
      };
    }

    if (modelProvider === 'custom') {
      return {
        builder: 'anthropic-messages',
        options: {
          isCustomRoute: true,
        },
      };
    }
  }

  return null;
}

function buildOpenRouterHeaders(req: Request) {
  const referer =
    req.get?.('HTTP-Referer') ?? req.headers['http-referer'] ?? undefined;
  const title = req.get?.('X-Title') ?? req.headers['x-title'] ?? undefined;

  return {
    'HTTP-Referer': referer ? String(referer) : 'https://tianji.dev/',
    'X-Title': title ? String(title) : 'Tianji',
  };
}

export interface AIRouterAttemptSummary {
  gatewayId: string;
  gatewayLogId?: string;
  statusCode?: number;
  retryable: boolean;
  errorType?: string;
  message?: string;
}

export function serializeAIRouterAttemptErrors(
  attempts: AIRouterAttemptSummary[]
) {
  return attempts
    .filter(
      (attempt) => attempt.message || attempt.statusCode || attempt.errorType
    )
    .map((attempt) =>
      compactObject({
        gatewayId: attempt.gatewayId,
        gatewayLogId: attempt.gatewayLogId,
        statusCode: attempt.statusCode,
        retryable: attempt.retryable,
        errorType: attempt.errorType,
        message: attempt.message,
      })
    );
}

export interface AIRouterAttemptNode extends AIRouterNodeEligibility {
  id: string;
  gatewayId: string;
  provider?: string | null;
  weight?: number | null;
  modelOverride?: string | null;
  timeoutMs?: number | null;
  retryableStatusCodes?: number[];
  failOnEmptyContent?: boolean | null;
  gateway: (AIRouterGatewayEligibility & { id: string }) | null;
}

export interface AIRouterAttemptTier<
  TNode extends AIRouterAttemptNode = AIRouterAttemptNode,
> {
  id: string;
  order: number;
  nodes: TNode[];
}

export interface AIRouterAttemptResult {
  ok: boolean;
  committed: boolean;
  gatewayId: string;
  logId?: string;
  statusCode?: number;
  response?: BufferedResponseSnapshot;
  failure?: {
    message: string;
    errorType?: 'network' | 'timeout' | 'upstream' | 'unknown' | string;
  };
}

interface AIRouterAttemptExecutionArgs<
  TNode extends AIRouterAttemptNode = AIRouterAttemptNode,
> {
  node: TNode;
  payload: Record<string, unknown>;
}

interface AIRouterModelsListArgs<
  TNode extends AIRouterAttemptNode = AIRouterAttemptNode,
> {
  node: TNode;
}

interface AIRouterRuntimeRouter<
  TNode extends AIRouterAttemptNode = AIRouterAttemptNode,
> {
  id: string;
  tiers?: AIRouterAttemptTier<TNode>[];
  nodes?: TNode[];
}

interface RunAIRouterAttemptsArgs<
  TNode extends AIRouterAttemptNode = AIRouterAttemptNode,
  TLog = unknown,
> {
  workspaceId: string;
  routerId: string;
  protocol: AIRouterProtocol;
  requestPayload: Record<string, unknown>;
  executeAttempt: (
    args: AIRouterAttemptExecutionArgs<TNode>
  ) => Promise<AIRouterAttemptResult>;
  loadRouter?: () => Promise<AIRouterRuntimeRouter<TNode> | null>;
  createLog?: (data: Prisma.AIRouterLogsUncheckedCreateInput) => Promise<TLog>;
  now?: () => number;
  random?: () => number;
}

export interface AIRouterModelsDiscoveryFailure {
  gatewayId: string;
  message: string;
}

interface RunAIRouterModelsDiscoveryArgs<
  TNode extends AIRouterAttemptNode = AIRouterAttemptNode,
> {
  workspaceId: string;
  routerId: string;
  protocol: AIRouterProtocol;
  loadRouter?: () => Promise<AIRouterRuntimeRouter<TNode> | null>;
  listModels: (args: AIRouterModelsListArgs<TNode>) => Promise<unknown[]>;
}

export async function runAIRouterAttempts<
  TNode extends AIRouterAttemptNode = AIRouterAttemptNode,
  TLog = unknown,
>(
  args: RunAIRouterAttemptsArgs<TNode, TLog>
): Promise<{
  result: AIRouterAttemptResult | null;
  finalResult: AIRouterAttemptResult | null;
  log: TLog;
  attempts: AIRouterAttemptSummary[];
}> {
  const now = args.now ?? Date.now;
  const start = now();
  const loadRouter =
    args.loadRouter ??
    (async () =>
      (await prisma.aIRouter.findFirst({
        where: {
          id: args.routerId,
          workspaceId: args.workspaceId,
          enabled: true,
        },
        include: {
          tiers: {
            include: {
              nodes: {
                include: {
                  gateway: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      })) as AIRouterRuntimeRouter<TNode> | null);
  const createLog =
    args.createLog ??
    (async (data: Prisma.AIRouterLogsUncheckedCreateInput) =>
      (await prisma.aIRouterLogs.create({
        data,
      })) as TLog);

  const router = await loadRouter();

  if (!router) {
    throw new AIRouterRuntimeError(
      404,
      'not_found',
      'AI Router not found or disabled'
    );
  }

  const tiers = getAIRouterRuntimeTiers(router);
  const attempts: AIRouterAttemptSummary[] = [];
  let finalResult: AIRouterAttemptResult | null = null;

  if (tiers.length === 0) {
    const log = await createLog(
      buildAIRouterLogData({
        workspaceId: args.workspaceId,
        routerId: args.routerId,
        protocol: args.protocol,
        status: AIRouterLogsStatus.Failed,
        attempts,
        duration: now() - start,
      })
    );

    return {
      result: null,
      finalResult: null,
      log,
      attempts,
    };
  }

  for (const tier of tiers) {
    const nodes = selectAIRouterTierAttemptNodes(
      tier.nodes,
      args.protocol,
      args.random
    );

    for (const node of nodes) {
      const payload = applyAIRouterModelOverride(
        args.requestPayload,
        node.modelOverride
      );
      const result = await args.executeAttempt({
        node,
        payload,
      });
      finalResult = result;
      const retryable = result.ok
        ? false
        : isAIRouterRetryableFailure({
            statusCode: result.statusCode,
            errorType: toAIRouterRetryableErrorType(result.failure?.errorType),
            retryableStatusCodes: node.retryableStatusCodes,
          });

      attempts.push({
        gatewayId: result.gatewayId,
        gatewayLogId: result.logId,
        statusCode: result.statusCode,
        retryable,
        errorType: result.failure?.errorType,
        message: result.failure?.message,
      });

      if (result.ok || result.committed || !retryable) {
        const status = result.ok
          ? AIRouterLogsStatus.Success
          : result.committed
            ? AIRouterLogsStatus.Partial
            : AIRouterLogsStatus.Failed;
        const log = await createLog(
          buildAIRouterLogData({
            workspaceId: args.workspaceId,
            routerId: args.routerId,
            protocol: args.protocol,
            status,
            attempts,
            finalAttempt: attempts[attempts.length - 1],
            duration: now() - start,
          })
        );

        return {
          result,
          finalResult: result,
          log,
          attempts,
        };
      }
    }
  }

  const log = await createLog(
    buildAIRouterLogData({
      workspaceId: args.workspaceId,
      routerId: args.routerId,
      protocol: args.protocol,
      status: AIRouterLogsStatus.Failed,
      attempts,
      finalAttempt: attempts[attempts.length - 1],
      duration: now() - start,
    })
  );

  return {
    result: null,
    finalResult,
    log,
    attempts,
  };
}

export async function runAIRouterModelsDiscovery<
  TNode extends AIRouterAttemptNode = AIRouterAttemptNode,
>(
  args: RunAIRouterModelsDiscoveryArgs<TNode>
): Promise<{
  models: unknown[];
  failures: AIRouterModelsDiscoveryFailure[];
  gatewayCount: number;
}> {
  const loadRouter =
    args.loadRouter ??
    (async () =>
      (await prisma.aIRouter.findFirst({
        where: {
          id: args.routerId,
          workspaceId: args.workspaceId,
          enabled: true,
        },
        include: {
          tiers: {
            include: {
              nodes: {
                include: {
                  gateway: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      })) as AIRouterRuntimeRouter<TNode> | null);

  const router = await loadRouter();

  if (!router) {
    throw new AIRouterRuntimeError(
      404,
      'not_found',
      'AI Router not found or disabled'
    );
  }

  const models: unknown[] = [];
  const modelIds = new Set<string>();
  const failures: AIRouterModelsDiscoveryFailure[] = [];
  let gatewayCount = 0;

  for (const tier of getAIRouterRuntimeTiers(router)) {
    const nodes = selectEligibleAIRouterNodes(tier.nodes, args.protocol);

    for (const node of nodes) {
      gatewayCount += 1;

      try {
        const nodeModels = await args.listModels({ node });

        for (const model of nodeModels) {
          const modelId = getAIRouterModelId(model);

          if (!modelId || modelIds.has(modelId)) {
            continue;
          }

          modelIds.add(modelId);
          models.push(model);
        }
      } catch (error) {
        failures.push({
          gatewayId: node.gatewayId,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return {
    models,
    failures,
    gatewayCount,
  };
}

function getAIRouterRuntimeTiers<TNode extends AIRouterAttemptNode>(
  router: AIRouterRuntimeRouter<TNode>
): AIRouterAttemptTier<TNode>[] {
  if (router.tiers && router.tiers.length > 0) {
    return [...router.tiers].sort((a, b) => a.order - b.order);
  }

  if (router.nodes && router.nodes.length > 0) {
    return [
      {
        id: 'default',
        order: 0,
        nodes: router.nodes,
      },
    ];
  }

  return [];
}

export function buildAIRouterOpenAIChatHandler(
  options?: AIRouterRuntimeHandlerOptions
): RequestHandler {
  return buildAIRouterRuntimeHandler({
    protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
    schema: openaiRequestSchema,
    runAttempts: options?.runAttempts,
  });
}

export function buildAIRouterOpenAIResponsesHandler(
  options?: AIRouterRuntimeHandlerOptions
): RequestHandler {
  return buildAIRouterRuntimeHandler({
    protocol: AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES,
    schema: openaiResponsesRequestSchema,
    runAttempts: options?.runAttempts,
  });
}

export function buildAIRouterAnthropicMessagesHandler(
  options?: AIRouterRuntimeHandlerOptions
): RequestHandler {
  return buildAIRouterRuntimeHandler({
    protocol: AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES,
    schema: anthropicRequestSchema,
    runAttempts: options?.runAttempts,
  });
}

export function buildAIRouterOpenAIModelsHandler(): RequestHandler {
  return buildAIRouterModelsHandler({
    protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
    responseFormat: 'openai',
  });
}

export function buildAIRouterAnthropicModelsHandler(): RequestHandler {
  return buildAIRouterModelsHandler({
    protocol: AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES,
    responseFormat: 'anthropic',
  });
}

function buildAIRouterModelsHandler(args: {
  protocol: AIRouterProtocol;
  responseFormat: 'openai' | 'anthropic';
}): RequestHandler {
  return async (req, res) => {
    const { workspaceId, routerId } = z
      .object({
        workspaceId: z.string(),
        routerId: z.string(),
      })
      .parse(req.params);
    const requestApiKey = getAIRouterModelsRequestApiKey(
      req,
      args.responseFormat
    );
    let verifyRequestApiKeyPromise: Promise<unknown> | undefined;
    const verifyRequestApiKey = () => {
      verifyRequestApiKeyPromise ??= verifyUserApiKey(requestApiKey);

      return verifyRequestApiKeyPromise;
    };

    try {
      const result = await runAIRouterModelsDiscovery({
        workspaceId,
        routerId,
        protocol: args.protocol,
        listModels: ({ node }) =>
          listAIRouterNodeModels({
            req,
            node,
            responseFormat: args.responseFormat,
            requestApiKey,
            verifyRequestApiKey,
          }),
      });

      if (result.gatewayCount === 0) {
        res.status(503).json({
          error: {
            message: 'No eligible AI Router nodes are available',
            type: 'router_unavailable',
          },
        });
        return;
      }

      if (result.models.length === 0 && result.failures.length > 0) {
        res.status(502).json({
          error: {
            message: 'AI Router failed to discover models from every gateway',
            type: 'router_failed',
          },
        });
        return;
      }

      if (args.responseFormat === 'anthropic') {
        res.json(formatAnthropicModelsList(result.models));
        return;
      }

      res.json({
        object: 'list',
        data: result.models,
      });
    } catch (error) {
      if (error instanceof AIRouterRuntimeError) {
        res.status(error.statusCode).json({
          error: {
            message: error.message,
            type: error.type,
          },
        });
        return;
      }

      throw error;
    }
  };
}

async function listAIRouterNodeModels(args: {
  req: Request;
  node: AIRouterAttemptNode;
  responseFormat: 'openai' | 'anthropic';
  requestApiKey: string;
  verifyRequestApiKey: () => Promise<unknown>;
}): Promise<unknown[]> {
  const modelProvider = getAIRouterNodeProvider(args.node);

  if (!modelProvider) {
    return [];
  }

  const gatewayApiKey = args.node.gateway?.modelApiKey?.trim();
  const modelApiKey = gatewayApiKey || args.requestApiKey;

  if (gatewayApiKey) {
    await args.verifyRequestApiKey();
  }

  if (
    modelProvider === 'anthropic' ||
    (args.responseFormat === 'anthropic' && modelProvider !== 'openrouter')
  ) {
    return listAIRouterAnthropicModels({
      req: args.req,
      node: args.node,
      modelProvider,
      modelApiKey,
    });
  }

  return listAIRouterOpenAIModels({
    req: args.req,
    node: args.node,
    modelProvider,
    modelApiKey,
  });
}

async function listAIRouterOpenAIModels(args: {
  req: Request;
  node: AIRouterAttemptNode;
  modelProvider: string;
  modelApiKey: string;
}): Promise<unknown[]> {
  const openai = new OpenAI({
    apiKey: args.modelApiKey,
    baseURL: resolveAIRouterOpenAIModelsBaseUrl(args.node, args.modelProvider),
    defaultHeaders:
      args.modelProvider === 'openrouter'
        ? buildOpenRouterHeaders(args.req)
        : undefined,
  });
  const list = await openai.models.list();

  return list.data;
}

async function listAIRouterAnthropicModels(args: {
  req: Request;
  node: AIRouterAttemptNode;
  modelProvider: string;
  modelApiKey: string;
}): Promise<unknown[]> {
  const baseUrl = resolveAIRouterAnthropicModelsBaseUrl(
    args.node,
    args.modelProvider
  );
  const queryString = new URLSearchParams(
    args.req.query as Record<string, string>
  ).toString();
  const upstreamResponse = await fetch(
    `${baseUrl}/models${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'x-api-key': args.modelApiKey,
        'anthropic-version':
          String(args.req.headers['anthropic-version'] ?? '') || '2023-06-01',
      },
    }
  );

  if (!upstreamResponse.ok) {
    throw new Error(
      `Models discovery failed with status ${upstreamResponse.status}`
    );
  }

  const body = await upstreamResponse.json();

  return Array.isArray(body?.data) ? body.data : [];
}

function resolveAIRouterOpenAIModelsBaseUrl(
  node: AIRouterAttemptNode,
  modelProvider: string
) {
  if (modelProvider === 'deepseek') {
    return 'https://api.deepseek.com';
  }

  if (modelProvider === 'openrouter') {
    return 'https://openrouter.ai/api/v1';
  }

  if (modelProvider === 'custom') {
    return node.gateway?.customModelBaseUrl?.trim() || undefined;
  }

  return undefined;
}

function resolveAIRouterAnthropicModelsBaseUrl(
  node: AIRouterAttemptNode,
  modelProvider: string
) {
  if (modelProvider === 'anthropic') {
    return 'https://api.anthropic.com/v1';
  }

  const baseUrl = node.gateway?.customModelBaseUrl?.trim();

  if (baseUrl) {
    return baseUrl;
  }

  throw new Error('Custom gateway base URL is required for models discovery');
}

function getAIRouterModelsRequestApiKey(
  req: Request,
  responseFormat: 'openai' | 'anthropic'
) {
  if (responseFormat === 'anthropic' && req.headers['x-api-key']) {
    return String(req.headers['x-api-key']);
  }

  return String(req.headers.authorization ?? '').replace('Bearer ', '');
}

function formatAnthropicModelsList(models: unknown[]) {
  const modelIds = models.flatMap((model) => {
    const modelId = getAIRouterModelId(model);

    return modelId ? [modelId] : [];
  });

  return {
    data: models,
    first_id: modelIds[0] ?? null,
    last_id: modelIds[modelIds.length - 1] ?? null,
    has_more: false,
  };
}

function getAIRouterModelId(model: unknown): string | null {
  if (!model || typeof model !== 'object') {
    return null;
  }

  const id = (model as Record<string, unknown>).id;

  return typeof id === 'string' && id ? id : null;
}

function buildAIRouterRuntimeHandler(args: {
  protocol: AIRouterProtocol;
  schema: z.ZodType<Record<string, unknown>>;
  runAttempts?: AIRouterRuntimeAttemptRunner;
}): RequestHandler {
  return async (req, res) => {
    const start = Date.now();
    const { workspaceId, routerId } = z
      .object({
        workspaceId: z.string(),
        routerId: z.string(),
      })
      .parse(req.params);

    try {
      const requestPayload = args.schema.parse(req.body);
      const stream = requestPayload.stream === true;
      let stopKeepAlive: (() => void) | undefined;

      if (stream) {
        setAIGatewayStreamHeaders(res);
        stopKeepAlive = startAIGatewayStreamKeepAlive(res, {
          writeInitial: true,
        });
      }

      try {
        const runAttempts = args.runAttempts ?? runAIRouterAttempts;
        const outcome = await runAttempts({
          workspaceId,
          routerId,
          protocol: args.protocol,
          requestPayload,
          executeAttempt: ({ node, payload }) => {
            const gatewayHandler = buildAIRouterGatewayHandlerForNode({
              protocol: args.protocol,
              node,
            });

            if (!gatewayHandler) {
              const modelProvider = getAIRouterNodeProvider(node);

              return Promise.resolve({
                ok: false,
                committed: false,
                gatewayId: node.gatewayId,
                statusCode: 400,
                failure: {
                  message: `AI Router provider ${modelProvider ?? 'unknown'} cannot serve protocol ${args.protocol}`,
                  errorType: 'unknown',
                },
              });
            }

            return executeBufferedAIGatewayAttempt({
              req,
              protocol: args.protocol,
              node,
              payload,
              gatewayHandler,
            });
          },
        });
        const result = outcome.result ?? outcome.finalResult;
        const canReplayAttemptResponse = result
          ? shouldReplayAIRouterAttemptResponse(result)
          : false;

        if (result?.response && result.ok && canReplayAttemptResponse) {
          replayBufferedResponse(result.response, res);
          return;
        }

        if (
          result?.response &&
          !result.committed &&
          !stream &&
          canReplayAttemptResponse
        ) {
          replayBufferedResponse(result.response, res);
          return;
        }

        if (
          result?.response &&
          !result.committed &&
          stream &&
          canReplayAttemptResponse
        ) {
          writeAIRouterStreamError(
            res,
            args.protocol,
            getBufferedFailureMessage(result.response),
            'router_failed'
          );
          return;
        }

        if (outcome.attempts.length === 0) {
          writeAIRouterRuntimeErrorResponse({
            res,
            protocol: args.protocol,
            stream,
            statusCode: 503,
            message: 'No eligible AI Router nodes are available',
            type: 'router_unavailable',
          });
          return;
        }

        const lastAttempt = outcome.attempts[outcome.attempts.length - 1];
        writeAIRouterRuntimeErrorResponse({
          res,
          protocol: args.protocol,
          stream,
          statusCode: lastAttempt?.statusCode ?? 502,
          message:
            lastAttempt?.message ?? 'AI Router exhausted all gateway attempts',
          type: 'router_failed',
        });
      } finally {
        stopKeepAlive?.();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = formatAIRouterValidationError(error);

        await createAIRouterRuntimeFailureLog({
          workspaceId,
          routerId,
          protocol: args.protocol,
          statusCode: 400,
          errorType: 'validation',
          message,
          duration: Date.now() - start,
        });

        res.status(400).json({
          error: {
            message,
            type: 'invalid_request',
          },
        });
        return;
      }

      if (error instanceof AIRouterRuntimeError) {
        writeAIRouterRuntimeErrorResponse({
          res,
          protocol: args.protocol,
          stream: res.headersSent,
          statusCode: error.statusCode,
          message: error.message,
          type: error.type,
        });
        return;
      }

      if (res.headersSent) {
        writeAIRouterStreamError(
          res,
          args.protocol,
          error instanceof Error ? error.message : 'Unknown error',
          'server_error'
        );
        return;
      }

      throw error;
    }
  };
}

function shouldReplayAIRouterAttemptResponse(result: AIRouterAttemptResult) {
  return result.failure?.errorType !== 'empty_content';
}

function writeAIRouterRuntimeErrorResponse(args: {
  res: Response;
  protocol: AIRouterProtocol;
  stream: boolean;
  statusCode: number;
  message: string;
  type: string;
}) {
  if (args.stream || args.res.headersSent) {
    writeAIRouterStreamError(
      args.res,
      args.protocol,
      args.message,
      args.type
    );
    return;
  }

  args.res.status(args.statusCode).json({
    error: {
      message: args.message,
      type: args.type,
    },
  });
}

function writeAIRouterStreamError(
  res: Response,
  protocol: AIRouterProtocol,
  message: string,
  type: string
) {
  if (protocol === AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES) {
    writeAIGatewayAnthropicStreamError(res, new Error(message));
    return;
  }

  if (res.writableEnded || res.destroyed) {
    return;
  }

  res.write(
    `data: ${JSON.stringify({
      error: {
        message,
        type,
      },
    })}\n\n`
  );
  res.write('data: [DONE]\n\n');
  res.end();
}

async function createAIRouterRuntimeFailureLog(args: {
  workspaceId: string;
  routerId: string;
  protocol: AIRouterProtocol;
  statusCode: number;
  errorType: string;
  message: string;
  duration: number;
}) {
  try {
    const router = await prisma.aIRouter.findFirst({
      where: {
        id: args.routerId,
        workspaceId: args.workspaceId,
        enabled: true,
      },
      select: {
        id: true,
      },
    });

    if (!router) {
      return;
    }

    await prisma.aIRouterLogs.create({
      data: buildAIRouterLogData({
        workspaceId: args.workspaceId,
        routerId: args.routerId,
        protocol: args.protocol,
        status: AIRouterLogsStatus.Failed,
        attempts: [],
        attemptErrors: [
          compactObject({
            statusCode: args.statusCode,
            retryable: false,
            errorType: args.errorType,
            message: args.message,
          }),
        ],
        duration: args.duration,
      }),
    });
  } catch (error) {
    logger.warn('[ai-router] failed to write runtime failure log', error);
  }
}

function buildAIRouterLogData(args: {
  workspaceId: string;
  routerId: string;
  protocol: AIRouterProtocol;
  status: AIRouterLogsStatus;
  attempts: AIRouterAttemptSummary[];
  finalAttempt?: AIRouterAttemptSummary;
  attemptErrors?: Record<string, unknown>[];
  duration: number;
}): Prisma.AIRouterLogsUncheckedCreateInput {
  return {
    workspaceId: args.workspaceId,
    routerId: args.routerId,
    protocol: args.protocol,
    status: args.status,
    finalGatewayId: args.finalAttempt?.gatewayId,
    finalGatewayLogId: args.finalAttempt?.gatewayLogId,
    attemptGatewayIds: args.attempts.map((attempt) => attempt.gatewayId),
    attemptGatewayLogIds: args.attempts.flatMap((attempt) =>
      attempt.gatewayLogId ? [attempt.gatewayLogId] : []
    ),
    attemptErrors: (args.attemptErrors ??
      serializeAIRouterAttemptErrors(args.attempts)) as any,
    attemptCount: args.attempts.length,
    duration: Math.max(0, Math.round(args.duration)),
  };
}

function formatAIRouterValidationError(error: z.ZodError) {
  const details = error.issues
    .map((issue) => {
      const path = issue.path.join('.');

      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');

  return details
    ? `Invalid AI Router request payload: ${details}`
    : 'Invalid AI Router request payload';
}

function toAIRouterRetryableErrorType(
  errorType: NonNullable<AIRouterAttemptResult['failure']>['errorType']
): AIRouterFailure['errorType'] {
  return errorType === 'network' || errorType === 'timeout'
    ? errorType
    : 'unknown';
}

function buildAIRouterGatewayHandlerForNode(args: {
  protocol: AIRouterProtocol;
  node: AIRouterAttemptNode;
}): RequestHandler | null {
  const config = resolveAIRouterGatewayHandlerConfig({
    protocol: args.protocol,
    modelProvider: getAIRouterNodeProvider(args.node),
  });

  return config ? buildAIRouterGatewayHandler(config) : null;
}

function buildAIRouterGatewayHandler(
  config: AIRouterGatewayHandlerConfig
): RequestHandler {
  if (config.builder === 'openai-chat') {
    return buildOpenAIHandler(config.options);
  }

  if (config.builder === 'openai-responses') {
    return buildOpenAIResponsesHandler(config.options);
  }

  return buildAnthropicHandler(config.options);
}

class AIRouterRuntimeError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly type: string,
    message: string
  ) {
    super(message);
  }
}

class AIRouterAttemptTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AI Router gateway attempt timed out after ${timeoutMs}ms`);
  }
}

export interface BufferedResponseSnapshot {
  statusCode: number;
  headers: Record<string, number | string | string[]>;
  chunks: Buffer[];
  jsonBody?: unknown;
  wroteBody: boolean;
  bodyStartedBeforeFailure: boolean;
  ended: boolean;
}

interface BufferedAIRouterAttemptResult extends AIRouterAttemptResult {
  response?: BufferedResponseSnapshot;
}

export interface AIRouterAttemptRequestContext {
  attemptReq: Request & AIGatewayLogAwareRequest;
  getGatewayLogId: () => Promise<string | undefined>;
}

export function createAIRouterAttemptRequest(args: {
  req: Request;
  node: AIRouterAttemptNode;
  payload: Record<string, unknown>;
}): AIRouterAttemptRequestContext {
  const attemptReq = Object.create(args.req) as Request &
    AIGatewayLogAwareRequest;
  let capturedGatewayLogId: string | undefined;

  attemptReq.params = {
    ...args.req.params,
    gatewayId: args.node.gatewayId,
  };
  attemptReq.body = args.payload;
  attemptReq.__aiGatewayLogPromise = undefined;
  attemptReq.__onAIGatewayLogCreated = (log) => {
    capturedGatewayLogId = log.id;
  };

  return {
    attemptReq,
    getGatewayLogId: () =>
      getBufferedAIGatewayLogId(attemptReq, capturedGatewayLogId),
  };
}

export function buildBufferedAIGatewayAttemptResult(args: {
  protocol?: AIRouterProtocol;
  failOnEmptyContent?: boolean | null;
  gatewayId: string;
  logId?: string;
  response?: BufferedResponseSnapshot;
  error?: unknown;
}): BufferedAIRouterAttemptResult {
  const timeout = args.error instanceof AIRouterAttemptTimeoutError;
  const partialFailure =
    Boolean(args.response?.bodyStartedBeforeFailure) ||
    Boolean(args.response?.wroteBody && !args.response.ended) ||
    Boolean(args.error && args.response?.wroteBody);

  if (args.error) {
    const statusCode = timeout ? 504 : getAIGatewayErrorStatusCode(args.error);

    return {
      ok: false,
      committed: partialFailure,
      gatewayId: args.gatewayId,
      logId: args.logId,
      statusCode,
      failure: {
        message:
          partialFailure && args.response
            ? getBufferedFailureMessage(args.response)
            : args.error instanceof Error
              ? args.error.message
              : 'Unknown error',
        errorType: timeout ? 'timeout' : 'unknown',
      },
      response: args.response,
    };
  }

  if (!args.response) {
    return {
      ok: false,
      committed: false,
      gatewayId: args.gatewayId,
      logId: args.logId,
      statusCode: 500,
      failure: {
        message: 'AI Gateway attempt did not produce a response',
        errorType: 'unknown',
      },
    };
  }

  const statusCode =
    args.response.statusCode >= 200 &&
    args.response.statusCode < 300 &&
    partialFailure
      ? 500
      : args.response.statusCode;
  const ok = statusCode >= 200 && statusCode < 300 && !partialFailure;
  const emptyContentFailure =
    ok &&
    args.failOnEmptyContent === true &&
    args.protocol &&
    isAIRouterBufferedResponseEmptyContent(args.protocol, args.response);

  if (emptyContentFailure) {
    return {
      ok: false,
      committed: false,
      gatewayId: args.gatewayId,
      logId: args.logId,
      statusCode: 502,
      failure: {
        message: 'AI Router gateway returned empty content',
        errorType: 'empty_content',
      },
      response: args.response,
    };
  }

  return {
    ok,
    committed: ok || partialFailure,
    gatewayId: args.gatewayId,
    logId: args.logId,
    statusCode,
    failure: ok
      ? undefined
      : {
          message: partialFailure
            ? 'AI Gateway attempt ended after partial output'
            : getBufferedFailureMessage(args.response),
          errorType: 'upstream',
        },
    response: args.response,
  };
}

async function executeBufferedAIGatewayAttempt(args: {
  req: Request;
  protocol: AIRouterProtocol;
  node: AIRouterAttemptNode;
  payload: Record<string, unknown>;
  gatewayHandler: RequestHandler;
}): Promise<BufferedAIRouterAttemptResult> {
  const attemptRequest = createAIRouterAttemptRequest({
    req: args.req,
    node: args.node,
    payload: args.payload,
  });
  const bufferedResponse = new BufferedExpressResponse();

  try {
    await runGatewayHandlerWithTimeout({
      handler: args.gatewayHandler,
      req: attemptRequest.attemptReq,
      res: bufferedResponse as unknown as Response,
      timeoutMs: args.node.timeoutMs ?? undefined,
    });

    const response = bufferedResponse.snapshot();
    const logId = await attemptRequest.getGatewayLogId();

    return buildBufferedAIGatewayAttemptResult({
      protocol: args.protocol,
      failOnEmptyContent: args.node.failOnEmptyContent,
      gatewayId: args.node.gatewayId,
      logId,
      response,
    });
  } catch (error) {
    const logId = await attemptRequest.getGatewayLogId();

    return buildBufferedAIGatewayAttemptResult({
      protocol: args.protocol,
      failOnEmptyContent: args.node.failOnEmptyContent,
      gatewayId: args.node.gatewayId,
      logId,
      error,
      response: bufferedResponse.wroteBody
        ? bufferedResponse.snapshot()
        : undefined,
    });
  }
}

async function getBufferedAIGatewayLogId(
  req: AIGatewayLogAwareRequest,
  capturedGatewayLogId?: string
): Promise<string | undefined> {
  if (req.__aiGatewayLogPromise) {
    try {
      const log = await req.__aiGatewayLogPromise;
      return log.id;
    } catch (error) {
      logger.warn('[ai-router] gateway log promise rejected', error);
    }
  }

  return capturedGatewayLogId;
}

async function runGatewayHandlerWithTimeout(args: {
  handler: RequestHandler;
  req: Request;
  res: Response;
  timeoutMs?: number;
}) {
  const handlerPromise = new Promise<void>((resolve, reject) => {
    const next: NextFunction = (error?: unknown) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    try {
      Promise.resolve(args.handler(args.req, args.res, next)).then(
        () => resolve(),
        reject
      );
    } catch (error) {
      reject(error);
    }
  });

  if (!args.timeoutMs || args.timeoutMs <= 0) {
    await handlerPromise;
    return;
  }

  let didTimeout = false;
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      didTimeout = true;
      reject(new AIRouterAttemptTimeoutError(args.timeoutMs!));
    }, args.timeoutMs);
  });

  try {
    await Promise.race([handlerPromise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }

    if (didTimeout) {
      handlerPromise.catch((error) => {
        logger.warn('[ai-router] timed out gateway attempt settled later', error);
      });
    }
  }
}

class BufferedExpressResponse {
  public statusCode = 200;
  public headersSent = false;
  public writableEnded = false;
  public wroteBody = false;
  private bodyStartedBeforeFailure = false;
  private readonly headers = new Map<string, number | string | string[]>();
  private readonly chunks: Buffer[] = [];
  private jsonBody: unknown;

  status(code: number) {
    if (this.wroteBody && code >= 400) {
      this.bodyStartedBeforeFailure = true;
    }

    this.statusCode = code;
    return this;
  }

  setHeader(name: string, value: number | string | readonly string[]) {
    this.headers.set(name.toLowerCase(), normalizeHeaderValue(value));
    return this;
  }

  getHeader(name: string) {
    return this.headers.get(name.toLowerCase());
  }

  getHeaders() {
    return Object.fromEntries(this.headers);
  }

  json(body: unknown) {
    this.jsonBody = body;
    if (!this.getHeader('content-type')) {
      this.setHeader('content-type', 'application/json; charset=utf-8');
    }
    this.write(JSON.stringify(body));
    this.end();
    return this;
  }

  write(chunk: unknown) {
    if (chunk !== undefined) {
      this.chunks.push(toBuffer(chunk));
      this.wroteBody = true;
    }
    this.headersSent = true;
    return true;
  }

  end(chunk?: unknown) {
    if (chunk !== undefined) {
      this.write(chunk);
    }
    this.headersSent = true;
    this.writableEnded = true;
    return this;
  }

  flush() {
    return undefined;
  }

  snapshot(): BufferedResponseSnapshot {
    return {
      statusCode: this.statusCode,
      headers: Object.fromEntries(this.headers),
      chunks: [...this.chunks],
      jsonBody: this.jsonBody,
      wroteBody: this.wroteBody,
      bodyStartedBeforeFailure: this.bodyStartedBeforeFailure,
      ended: this.writableEnded,
    };
  }
}

// AI Router v1 intentionally buffers each attempt, including SSE streams,
// before replaying to the client. This trades streaming latency and memory for
// failover safety: the router can try the next gateway until a response is
// committed to the real client.
function replayBufferedResponse(
  snapshot: BufferedResponseSnapshot,
  res: Response
) {
  if (!res.headersSent) {
    res.status(snapshot.statusCode);

    for (const [name, value] of Object.entries(snapshot.headers)) {
      res.setHeader(name, value);
    }
  }

  for (const chunk of snapshot.chunks) {
    res.write(chunk);
  }

  res.end();
}

function getBufferedFailureMessage(snapshot: BufferedResponseSnapshot): string {
  const jsonMessage = readJsonErrorMessage(snapshot.jsonBody);

  if (jsonMessage) {
    return jsonMessage;
  }

  const text = Buffer.concat(snapshot.chunks).toString('utf8').trim();

  return text || `AI Gateway attempt failed with status ${snapshot.statusCode}`;
}

function readJsonErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, any>;
  const message =
    record.error?.message ??
    record.error?.error?.message ??
    record.message ??
    record.type;

  return typeof message === 'string' && message ? message : null;
}

export interface AIRouterBufferedContentInspection {
  parsed: boolean;
  empty: boolean;
  hasToolWork: boolean;
  text: string;
}

export function inspectAIRouterBufferedResponseContent(
  protocol: AIRouterProtocol,
  snapshot: BufferedResponseSnapshot
): AIRouterBufferedContentInspection {
  const fromJson = inspectAIRouterJsonContent(protocol, snapshot.jsonBody);

  if (fromJson.parsed) {
    return fromJson;
  }

  return inspectAIRouterSSEContent(protocol, snapshot.chunks);
}

function isAIRouterBufferedResponseEmptyContent(
  protocol: AIRouterProtocol,
  snapshot: BufferedResponseSnapshot
) {
  const inspection = inspectAIRouterBufferedResponseContent(protocol, snapshot);

  return inspection.parsed && inspection.empty;
}

function inspectAIRouterJsonContent(
  protocol: AIRouterProtocol,
  body: unknown
): AIRouterBufferedContentInspection {
  if (protocol === AI_ROUTER_PROTOCOLS.OPENAI_CHAT) {
    return inspectOpenAIChatJsonContent(body);
  }

  if (protocol === AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES) {
    return inspectOpenAIResponsesJsonContent(body);
  }

  if (protocol === AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES) {
    return inspectAnthropicMessagesJsonContent(body);
  }

  return unparsedAIRouterContentInspection();
}

function inspectOpenAIChatJsonContent(
  body: unknown
): AIRouterBufferedContentInspection {
  if (!isAIRouterRecord(body) || !Array.isArray(body.choices)) {
    return unparsedAIRouterContentInspection();
  }

  let parsed = false;
  let text = '';
  let hasToolWork = false;

  for (const choice of body.choices) {
    if (!isAIRouterRecord(choice) || !isAIRouterRecord(choice.message)) {
      continue;
    }

    const message = choice.message;

    if (typeof message.content === 'string') {
      parsed = true;
      text += message.content;
    }

    hasToolWork =
      hasToolWork ||
      (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) ||
      (message.function_call !== undefined && message.function_call !== null);
  }

  return parsed || hasToolWork
    ? parsedAIRouterContentInspection(text, hasToolWork)
    : unparsedAIRouterContentInspection();
}

function inspectOpenAIResponsesJsonContent(
  body: unknown
): AIRouterBufferedContentInspection {
  if (!isAIRouterRecord(body)) {
    return unparsedAIRouterContentInspection();
  }

  const hasDirectText = typeof body.output_text === 'string';
  let parsed = hasDirectText;
  let text = hasDirectText ? body.output_text : '';
  let hasToolWork = false;

  if (Array.isArray(body.output)) {
    for (const item of body.output) {
      if (!isAIRouterRecord(item)) {
        continue;
      }

      if (isOpenAIResponsesToolWorkType(item.type)) {
        parsed = true;
        hasToolWork = true;
      }

      if (hasDirectText || !Array.isArray(item.content)) {
        continue;
      }

      for (const content of item.content) {
        const contentText = getOpenAIResponsesContentText(content);

        if (contentText !== null) {
          parsed = true;
          text += contentText;
        }
      }
    }
  }

  return parsed
    ? parsedAIRouterContentInspection(text, hasToolWork)
    : unparsedAIRouterContentInspection();
}

function inspectAnthropicMessagesJsonContent(
  body: unknown
): AIRouterBufferedContentInspection {
  if (!isAIRouterRecord(body) || !Array.isArray(body.content)) {
    return unparsedAIRouterContentInspection();
  }

  let text = '';
  let hasToolWork = false;
  let parsed = false;

  for (const content of body.content) {
    if (!isAIRouterRecord(content)) {
      continue;
    }

    if (content.type === 'text' && typeof content.text === 'string') {
      parsed = true;
      text += content.text;
    }

    if (content.type === 'tool_use') {
      parsed = true;
      hasToolWork = true;
    }
  }

  return parsed
    ? parsedAIRouterContentInspection(text, hasToolWork)
    : unparsedAIRouterContentInspection();
}

function inspectAIRouterSSEContent(
  protocol: AIRouterProtocol,
  chunks: Buffer[]
): AIRouterBufferedContentInspection {
  const events = parseAIRouterSSEEvents(chunks);

  if (events.length === 0) {
    return unparsedAIRouterContentInspection();
  }

  if (protocol === AI_ROUTER_PROTOCOLS.OPENAI_CHAT) {
    return inspectOpenAIChatSSEContent(events);
  }

  if (protocol === AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES) {
    return inspectOpenAIResponsesSSEContent(events);
  }

  if (protocol === AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES) {
    return inspectAnthropicMessagesSSEContent(events);
  }

  return unparsedAIRouterContentInspection();
}

function inspectOpenAIChatSSEContent(
  events: unknown[]
): AIRouterBufferedContentInspection {
  let parsed = false;
  let text = '';
  let hasToolWork = false;

  for (const event of events) {
    if (!isAIRouterRecord(event) || !Array.isArray(event.choices)) {
      continue;
    }

    for (const choice of event.choices) {
      if (!isAIRouterRecord(choice) || !isAIRouterRecord(choice.delta)) {
        continue;
      }

      const delta = choice.delta;

      if (typeof delta.content === 'string') {
        parsed = true;
        text += delta.content;
      }

      hasToolWork =
        hasToolWork ||
        (Array.isArray(delta.tool_calls) && delta.tool_calls.length > 0) ||
        (delta.function_call !== undefined && delta.function_call !== null);
    }
  }

  return parsed || hasToolWork
    ? parsedAIRouterContentInspection(text, hasToolWork)
    : unparsedAIRouterContentInspection();
}

function inspectOpenAIResponsesSSEContent(
  events: unknown[]
): AIRouterBufferedContentInspection {
  let parsed = false;
  let text = '';
  let hasToolWork = false;

  for (const event of events) {
    if (!isAIRouterRecord(event) || typeof event.type !== 'string') {
      continue;
    }

    if (event.type === 'response.output_text.delta') {
      parsed = true;

      if (typeof event.delta === 'string') {
        text += event.delta;
      }
    }

    if (event.type === 'response.function_call_arguments.delta') {
      parsed = true;
      hasToolWork = true;
    }

    if (
      event.type === 'response.output_item.added' ||
      event.type === 'response.output_item.done'
    ) {
      const item = isAIRouterRecord(event.item)
        ? event.item
        : isAIRouterRecord(event.output_item)
          ? event.output_item
          : null;

      if (item && isOpenAIResponsesToolWorkType(item.type)) {
        parsed = true;
        hasToolWork = true;
      }
    }
  }

  return parsed
    ? parsedAIRouterContentInspection(text, hasToolWork)
    : unparsedAIRouterContentInspection();
}

function inspectAnthropicMessagesSSEContent(
  events: unknown[]
): AIRouterBufferedContentInspection {
  let parsed = false;
  let text = '';
  let hasToolWork = false;

  for (const event of events) {
    if (!isAIRouterRecord(event) || typeof event.type !== 'string') {
      continue;
    }

    if (event.type === 'content_block_delta') {
      const delta = event.delta;

      if (isAIRouterRecord(delta) && delta.type === 'text_delta') {
        if (typeof delta.text === 'string') {
          parsed = true;
          text += delta.text;
        }
      }
    }

    if (event.type === 'content_block_start') {
      const contentBlock = event.content_block;

      if (
        isAIRouterRecord(contentBlock) &&
        contentBlock.type === 'tool_use'
      ) {
        parsed = true;
        hasToolWork = true;
      }
    }
  }

  return parsed
    ? parsedAIRouterContentInspection(text, hasToolWork)
    : unparsedAIRouterContentInspection();
}

function parseAIRouterSSEEvents(chunks: Buffer[]): unknown[] {
  const events: unknown[] = [];
  const text = Buffer.concat(chunks).toString('utf8');

  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('data: ')) {
      continue;
    }

    const data = line.slice('data: '.length).trim();

    if (!data || data === '[DONE]') {
      continue;
    }

    try {
      events.push(JSON.parse(data));
    } catch {
      continue;
    }
  }

  return events;
}

function getOpenAIResponsesContentText(content: unknown): string | null {
  if (!isAIRouterRecord(content)) {
    return null;
  }

  if (typeof content.text === 'string') {
    return content.text;
  }

  if (isAIRouterRecord(content.text) && typeof content.text.value === 'string') {
    return content.text.value;
  }

  return null;
}

function isOpenAIResponsesToolWorkType(type: unknown): boolean {
  return (
    type === 'function_call' ||
    type === 'tool_call' ||
    type === 'web_search_call' ||
    type === 'file_search_call' ||
    type === 'computer_call'
  );
}

function parsedAIRouterContentInspection(
  text: string,
  hasToolWork: boolean
): AIRouterBufferedContentInspection {
  const trimmedText = text.trim();

  return {
    parsed: true,
    empty: !hasToolWork && trimmedText.length === 0,
    hasToolWork,
    text: trimmedText,
  };
}

function unparsedAIRouterContentInspection(): AIRouterBufferedContentInspection {
  return {
    parsed: false,
    empty: false,
    hasToolWork: false,
    text: '',
  };
}

function isAIRouterRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object');
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined)
  );
}

function normalizeHeaderValue(
  value: number | string | readonly string[]
): number | string | string[] {
  return typeof value === 'string' || typeof value === 'number'
    ? value
    : [...value];
}

function toBuffer(chunk: unknown) {
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }

  if (chunk instanceof Uint8Array) {
    return Buffer.from(chunk);
  }

  return Buffer.from(String(chunk));
}
