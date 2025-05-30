import zmq from 'zeromq';
import { zmqUrl } from './shared.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import { generateLighthouse } from '../utils/screenshot/lighthouse.js';
import { chunk, get, invertBy, omit, uniq, values } from 'lodash-es';
import { prisma } from '../model/_client.js';
import { Prisma, WebsiteLighthouseReportStatus } from '@prisma/client';
import { subscribeEventBus } from '../ws/shared.js';
import {
  buildSurveyClassifyPrompt,
  buildSurveyTranslationPrompt,
  classifySurveyMQSchema,
  translateSurveyMQSchema,
} from '../model/prompt/survey.js';
import dayjs from 'dayjs';
import { ensureJSONOutput, requestOpenAI } from '../model/openai.js';
import pMap from 'p-map';
import { runTask } from '../model/task.js';
import { promMQConsumeCounter } from '../utils/prometheus/client.js';

export async function runMQWorker() {
  const sock = new zmq.Pull();
  sock.connect(zmqUrl);

  logger.info('Worker connected to:', zmqUrl);

  for await (const [_type, _msg] of sock) {
    const type = String(_type);
    const msg = String(_msg);
    logger.info('Received message', type, msg);

    try {
      if (type === 'lighthouse') {
        await runLighthouseReportWorker(msg);
      } else if (type === 'surveyClassify') {
        await runSurveyAIClassifyWorker(msg);
      } else if (type === 'surveyTranslation') {
        await runSurveyAITranslationWorker(msg);
      }
    } catch (err) {
      logger.error('MQ Worker throw error', { type, msg }, err);
    }
  }
}

async function runLighthouseReportWorker(msg: string) {
  logger.info('Start run lighthouse report');
  promMQConsumeCounter.inc({ type: 'lighthouse' });

  const payload = z
    .object({
      workspaceId: z.string(),
      websiteId: z.string(),
      reportId: z.string(),
      url: z.string().url(),
    })
    .parse(JSON.parse(msg));

  try {
    const result = await generateLighthouse(payload.url);

    logger.info('Successfully generated lighthouse report');

    const performanceScore =
      Number(get(result, ['categories', 'performance', 'score'], 0)) * 100;
    const accessibilityScore =
      Number(get(result, ['categories', 'accessibility', 'score'], 0)) * 100;
    const bestPracticesScore =
      Number(get(result, ['categories', 'best-practices', 'score'], 0)) * 100;
    const seoScore =
      Number(get(result, ['categories', 'seo', 'score'], 0)) * 100;

    await prisma.websiteLighthouseReport.update({
      where: {
        id: payload.reportId,
      },
      data: {
        status: WebsiteLighthouseReportStatus.Success,
        result: JSON.stringify(result),
        performanceScore,
        accessibilityScore,
        bestPracticesScore,
        seoScore,
      },
    });
  } catch (err) {
    logger.error('Failed to generate lighthouse report:', err);
    await prisma.websiteLighthouseReport.update({
      where: {
        id: payload.reportId,
      },
      data: {
        status: WebsiteLighthouseReportStatus.Failed,
        errorMessage: String(err),
      },
    });
  } finally {
    subscribeEventBus.emit('onLighthouseWorkCompleted', payload.workspaceId, {
      websiteId: payload.websiteId,
    });
  }
}

async function runSurveyAIClassifyWorker(msg: string) {
  logger.info('Start run survey AI classify');
  promMQConsumeCounter.inc({ type: 'surveyClassify' });

  const {
    workspaceId,
    surveyId,
    startAt,
    endAt,
    runStrategy,
    languageStrategy,
    payloadContentField,
    suggestionCategory,
    language,
  } = classifySurveyMQSchema.parse(JSON.parse(msg));

  await runTask(workspaceId, 'surveyClassify', async () => {
    const where: Prisma.SurveyResultWhereInput = {
      surveyId,
      createdAt: {
        gt: dayjs(startAt).toDate(),
        lt: dayjs(endAt).toDate(),
      },
    };

    if (runStrategy === 'skipExist') {
      where.aiCategory = null;
    } else if (runStrategy === 'skipInSuggest') {
      where.OR = [
        ...(where.OR ?? []),
        ...(suggestionCategory.length > 0
          ? [{ aiCategory: { notIn: suggestionCategory } }]
          : []),
        {
          aiCategory: null,
        },
      ];
    }

    logger.info(
      'Process run survey AI classify, where:',
      JSON.stringify(where)
    );

    const data = await prisma.surveyResult.findMany({
      where,
      select: {
        id: true,
        payload: true,
      },
    });

    if (data.length === 0) {
      const result = {
        workspaceId,
        surveyId,
        analysisCount: 0,
        processedCount: 0,
        categorys: [],
        effectCount: 0,
      };
      logger.info('Process run survey AI completed:', result);
      subscribeEventBus.emit(
        'onSurveyClassifyWorkCompleted',
        workspaceId,
        omit(result, 'workspaceId')
      );
      return result;
    }

    logger.info(
      'Process run survey AI classify, filtered data count:',
      data.length
    );

    let categoryJson = {};
    let currentSuggestionCategory = uniq([...suggestionCategory]);

    // --------- TOOOO heavy, use fixed number to group
    // const groups = groupByTokenSize(
    //   data.map((item) => ({
    //     id: item.id,
    //     content: item.payload[payloadContentField] ?? '',
    //   })),
    //   (item) => item.content,
    //   Math.ceil(modelMaxToken / 3) -
    //     calcOpenAIToken(JSON.stringify(currentSuggestionCategory))
    // );

    const groups = chunk(
      data.map((item) => ({
        id: item.id,
        content: item.payload[payloadContentField] ?? '',
      })),
      100 // use 100 as group size default
    );

    logger.info('Process run survey AI classify, groups', groups.length);

    let inc = 0;
    let effectCount = 0;
    for (const group of groups) {
      const { prompt, question } = buildSurveyClassifyPrompt(
        group,
        currentSuggestionCategory,
        languageStrategy === 'user' ? language : 'en'
      );

      logger.info(
        `Process run survey AI classify, group batch ${++inc}/${groups.length}, size: ${group.length}`
      );

      const res = await requestOpenAI(workspaceId, prompt, question, {
        response_format: { type: 'json_object' },
        top_p: 0,
        temperature: 0,
      });

      const json = ensureJSONOutput(res);

      if (json === null) {
        throw new Error('Failed to parse JSON');
      }

      if (json.error) {
        throw new Error(String(json.error));
      }

      logger.info(
        'Process run survey AI classify, parsed size:',
        values(json).length
      );

      const categoryMap = invertBy(json);
      await pMap(
        Object.keys(categoryMap),
        async (category) => {
          const ids = categoryMap[category];
          if (Array.isArray(ids) && ids.length > 0) {
            const res = await prisma.surveyResult.updateMany({
              where: {
                id: {
                  in: ids,
                },
              },
              data: {
                aiCategory: category,
              },
            });

            effectCount += res.count;
          }
        },
        {
          concurrency: 5,
        }
      );

      currentSuggestionCategory = uniq([
        ...currentSuggestionCategory,
        ...values(json),
      ]);
      categoryJson = {
        ...categoryJson,
        ...json,
      };
    }

    logger.info('Process run survey AI classify, AI completed.');

    const result = {
      workspaceId,
      surveyId,
      analysisCount: data.length,
      processedCount: Object.keys(categoryJson).length,
      categorys: uniq(Object.keys(categoryJson)),
      effectCount,
    };

    logger.info('Process run survey AI completed:', result);

    subscribeEventBus.emit(
      'onSurveyClassifyWorkCompleted',
      workspaceId,
      omit(result, 'workspaceId')
    );

    return result;
  });
}

async function runSurveyAITranslationWorker(msg: string) {
  logger.info('Start run survey AI translation');
  promMQConsumeCounter.inc({ type: 'surveyTranslation' });

  const {
    workspaceId,
    surveyId,
    startAt,
    endAt,
    runStrategy,
    languageStrategy,
    payloadContentField,
    language,
  } = translateSurveyMQSchema.parse(JSON.parse(msg));

  await runTask(workspaceId, 'surveyTranslation', async () => {
    const where: Prisma.SurveyResultWhereInput = {
      surveyId,
      createdAt: {
        gt: dayjs(startAt).toDate(),
        lt: dayjs(endAt).toDate(),
      },
    };

    if (runStrategy === 'skipExist') {
      where.aiTranslation = null;
    }

    logger.info(
      'Process run survey AI translation, where:',
      JSON.stringify(where)
    );

    const data = await prisma.surveyResult.findMany({
      where,
      select: {
        id: true,
        payload: true,
      },
    });

    if (data.length === 0) {
      const result = {
        workspaceId,
        surveyId,
        analysisCount: 0,
        processedCount: 0,
        effectCount: 0,
      };
      logger.info('Process run survey AI completed:', result);
      subscribeEventBus.emit(
        'onSurveyTranslationWorkCompleted',
        workspaceId,
        omit(result, 'workspaceId')
      );
      return result;
    }

    logger.info(
      'Process run survey AI classify, filtered data count:',
      data.length
    );

    const groups = chunk(
      data.map((item) => ({
        id: item.id,
        content: item.payload[payloadContentField] ?? '',
      })),
      100 // use 100 as group size default
    );

    logger.info('Process run survey AI classify, groups', groups.length);

    let inc = 0;

    let resultJson: Record<string, string> = {};
    for (const group of groups) {
      const { prompt } = buildSurveyTranslationPrompt(
        group,
        languageStrategy === 'user' ? language : 'en'
      );

      logger.info(
        `Process run survey AI translation, group batch ${++inc}/${groups.length}, size: ${group.length}`
      );

      const res = await requestOpenAI(
        workspaceId,
        prompt,
        'Please help me generate data.',
        {
          response_format: { type: 'json_object' },
        }
      );

      const json = ensureJSONOutput(res);

      if (json === null) {
        throw new Error('Failed to parse JSON');
      }

      if (json.error) {
        throw new Error(String(json.error));
      }

      logger.info(
        'Process run survey AI translation, parsed size:',
        values(json).length
      );

      resultJson = {
        ...resultJson,
        ...json,
      };
    }

    logger.info('Process run survey AI classify, AI completed.');

    let effectCount = 0;
    await pMap(
      Object.keys(resultJson),
      async (id) => {
        const prev = data.find((d) => d.id === id);

        if (prev && resultJson[id]) {
          await prisma.surveyResult.update({
            where: {
              id,
            },
            data: {
              aiTranslation: resultJson[id],
            },
          });

          effectCount++;
        }
      },
      {
        concurrency: 5,
      }
    );

    const result = {
      workspaceId,
      surveyId,
      analysisCount: data.length,
      processedCount: Object.keys(resultJson).length,
      effectCount,
    };

    logger.info('Process run survey AI translation completed:', result);

    subscribeEventBus.emit(
      'onSurveyTranslationWorkCompleted',
      workspaceId,
      omit(result, 'workspaceId')
    );

    return result;
  });
}
