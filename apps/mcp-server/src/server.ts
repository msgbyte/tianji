import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { initOpenapiSDK, openApiClient } from 'tianji-client-sdk';
import { z } from 'zod';
import { fetchAllPaginatedData } from './utils/pagination.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'Tianji MCP Server',
    version: '0.1.0',
  });

  const tianjiBaseUrl = process.env.TIANJI_BASE_URL;
  if (!tianjiBaseUrl) {
    throw new Error('TIANJI_BASE_URL is required');
  }
  const apiKey = process.env.TIANJI_API_KEY;
  if (!apiKey) {
    throw new Error('TIANJI_API_KEY is required');
  }
  const workspaceId = process.env.TIANJI_WORKSPACE_ID;
  if (!workspaceId) {
    throw new Error('TIANJI_WORKSPACE_ID is required');
  }

  const now = new Date().toISOString();

  initOpenapiSDK(tianjiBaseUrl, {
    apiKey: apiKey,
  });

  // Add service to query survey results
  server.tool(
    'tianji_get_survey_results',
    'Query survey questionnaire result data',
    {
      workspaceId: z
        .string()
        .default(workspaceId)
        .describe('Tianji workspace ID'),
      surveyId: z.string().describe('Survey questionnaire ID'),
      limit: z
        .number()
        .default(20)
        .describe('Limit the number of records returned'),
      cursor: z.string().optional().describe('Pagination cursor'),
      startAt: z
        .string()
        .describe(
          `Start time, ISO format, example: 2023-10-01T00:00:00Z, current time is: ${now}`
        ),
      endAt: z
        .string()
        .describe(
          `End time, ISO format, example: 2023-10-31T23:59:59Z, current time is: ${now}`
        ),
      filter: z.string().optional().describe('Filter conditions'),
    },
    async (
      params,
      extra
    ): Promise<{
      content: Array<{
        type: 'text';
        text: string;
      }>;
    }> => {
      try {
        const results = await fetchAllPaginatedData(
          (queryParams: { cursor?: string }) =>
            openApiClient.SurveyService.surveyResultList({
              workspaceId: params.workspaceId,
              surveyId: params.surveyId,
              limit: params.limit,
              cursor: queryParams.cursor,
              startAt: new Date(params.startAt).valueOf(),
              endAt: new Date(params.endAt).valueOf(),
              filter: params.filter,
            }),
          { cursor: params.cursor }
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results),
            },
          ],
        };
      } catch (error) {
        console.error('Failed to get survey results:', error);
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Failed to get survey results',
            },
          ],
        };
      }
    }
  );

  // Add service to get individual survey information
  server.tool(
    'tianji_get_survey_info',
    'Get basic information of a specified survey questionnaire',
    {
      workspaceId: z
        .string()
        .default(workspaceId)
        .describe('Tianji workspace ID'),
      surveyId: z.string().describe('Survey questionnaire ID'),
    },
    async (
      params,
      extra
    ): Promise<{
      content: Array<{
        type: 'text';
        text: string;
      }>;
    }> => {
      try {
        const surveyInfo = await openApiClient.SurveyService.surveyGet({
          workspaceId: params.workspaceId,
          surveyId: params.surveyId,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(surveyInfo),
            },
          ],
        };
      } catch (error) {
        console.error('Failed to get survey information:', error);
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Failed to get survey info',
            },
          ],
        };
      }
    }
  );

  // Add service to get survey list
  server.tool(
    'tianji_get_all_survey_list',
    'Get all survey list in the workspace',
    {
      workspaceId: z
        .string()
        .describe(`Tianji workspace ID, default: ${workspaceId}`),
    },
    async (
      params,
      extra
    ): Promise<{
      content: Array<{
        type: 'text';
        text: string;
      }>;
    }> => {
      try {
        const surveys = await openApiClient.SurveyService.surveyAll({
          workspaceId: params.workspaceId,
        });

        return {
          content: surveys.map((survey) => ({
            type: 'text',
            text: JSON.stringify({
              id: survey.id,
              name: survey.name,
            }),
          })),
        };
      } catch (error) {
        console.error('Failed to get survey list:', error);
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Failed to get survey list',
            },
          ],
        };
      }
    }
  );

  // Add service to get website list
  server.tool(
    'tianji_get_website_list',
    'Get all websites in the workspace',
    {
      workspaceId: z
        .string()
        .default(workspaceId)
        .describe('Tianji workspace ID'),
    },
    async (
      params,
      extra
    ): Promise<{
      content: Array<{
        type: 'text';
        text: string;
      }>;
    }> => {
      try {
        const websites = await openApiClient.WebsiteService.websiteAll({
          workspaceId: params.workspaceId,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(websites),
            },
          ],
        };
      } catch (error) {
        console.error('Failed to get website list:', error);
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Failed to get website list',
            },
          ],
        };
      }
    }
  );

  // Add service to get website info
  server.tool(
    'tianji_get_website_info',
    'Get detailed information about a specific website',
    {
      workspaceId: z
        .string()
        .default(workspaceId)
        .describe('Tianji workspace ID'),
      websiteId: z.string().describe('Website ID'),
    },
    async (
      params,
      extra
    ): Promise<{
      content: Array<{
        type: 'text';
        text: string;
      }>;
    }> => {
      try {
        const websiteInfo = await openApiClient.WebsiteService.websiteInfo({
          workspaceId: params.workspaceId,
          websiteId: params.websiteId,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(websiteInfo),
            },
          ],
        };
      } catch (error) {
        console.error('Failed to get website information:', error);
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Failed to get website info',
            },
          ],
        };
      }
    }
  );

  // Add service to get website statistics
  server.tool(
    'tianji_get_website_stats',
    'Get statistics data for a website',
    {
      workspaceId: z
        .string()
        .default(workspaceId)
        .describe('Tianji workspace ID'),
      websiteId: z.string().describe('Website ID'),
      startAt: z
        .string()
        .describe(
          `Start time, ISO format, example: 2023-10-01T00:00:00Z, current time is: ${now}`
        ),
      endAt: z
        .string()
        .describe(
          `End time, ISO format, example: 2023-10-31T23:59:59Z, current time is: ${now}`
        ),
      unit: z.string().optional().describe('Time unit for statistics grouping'),
    },
    async (
      params,
      extra
    ): Promise<{
      content: Array<{
        type: 'text';
        text: string;
      }>;
    }> => {
      try {
        const stats = await openApiClient.WebsiteService.websiteStats({
          workspaceId: params.workspaceId,
          websiteId: params.websiteId,
          startAt: new Date(params.startAt).valueOf(),
          endAt: new Date(params.endAt).valueOf(),
          unit: params.unit,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats),
            },
          ],
        };
      } catch (error) {
        console.error('Failed to get website statistics:', error);
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Failed to get website statistics',
            },
          ],
        };
      }
    }
  );

  // Add service to get website pageviews
  server.tool(
    'tianji_get_website_pageviews',
    'Get pageview and session data for a website',
    {
      workspaceId: z
        .string()
        .default(workspaceId)
        .describe('Tianji workspace ID'),
      websiteId: z.string().describe('Website ID'),
      startAt: z
        .string()
        .describe(
          `Start time, ISO format, example: 2023-10-01T00:00:00Z, current time is: ${now}`
        ),
      endAt: z
        .string()
        .describe(
          `End time, ISO format, example: 2023-10-31T23:59:59Z, current time is: ${now}`
        ),
      unit: z.string().optional().describe('Time unit for data grouping'),
    },
    async (
      params,
      extra
    ): Promise<{
      content: Array<{
        type: 'text';
        text: string;
      }>;
    }> => {
      try {
        const pageviewData =
          await openApiClient.WebsiteService.websitePageviews({
            workspaceId: params.workspaceId,
            websiteId: params.websiteId,
            startAt: new Date(params.startAt).valueOf(),
            endAt: new Date(params.endAt).valueOf(),
            unit: params.unit,
          });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pageviewData),
            },
          ],
        };
      } catch (error) {
        console.error('Failed to get website pageviews:', error);
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Failed to get website pageview data',
            },
          ],
        };
      }
    }
  );

  // Add service to get website metrics
  server.tool(
    'tianji_get_website_metrics',
    'Get specific metrics for a website (url, referrer, browser, os, etc.)',
    {
      workspaceId: z
        .string()
        .default(workspaceId)
        .describe('Tianji workspace ID'),
      websiteId: z.string().describe('Website ID'),
      type: z
        .enum([
          'url',
          'language',
          'referrer',
          'title',
          'browser',
          'os',
          'device',
          'country',
          'event',
        ])
        .describe('Type of metrics to retrieve'),
      startAt: z
        .string()
        .describe(
          `Start time, ISO format, example: 2023-10-01T00:00:00Z, current time is: ${now}`
        ),
      endAt: z
        .string()
        .describe(
          `End time, ISO format, example: 2023-10-31T23:59:59Z, current time is: ${now}`
        ),
    },
    async (
      params,
      extra
    ): Promise<{
      content: Array<{
        type: 'text';
        text: string;
      }>;
    }> => {
      try {
        const metricsData = await openApiClient.WebsiteService.websiteMetrics({
          workspaceId: params.workspaceId,
          websiteId: params.websiteId,
          type: params.type,
          startAt: new Date(params.startAt).valueOf(),
          endAt: new Date(params.endAt).valueOf(),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metricsData),
            },
          ],
        };
      } catch (error) {
        console.error('Failed to get website metrics:', error);
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Failed to get website metrics data',
            },
          ],
        };
      }
    }
  );

  return server;
}
