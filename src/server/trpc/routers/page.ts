import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { prisma } from '../../model/_client.js';
import { z } from 'zod';
import { OPENAPI_TAG } from '../../utils/const.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import {
  MonitorStatusPageModelSchema,
  PageModelSchema,
} from '../../prisma/zod/index.js';
import { customDomainManager } from '../../model/page/manager.js';
import { invalidateStaticPageCache } from '../../router/staticPage.js';

// Union type for page info
const PageInfoSchema = z.union([
  MonitorStatusPageModelSchema.extend({
    type: z.literal('status'),
  }),
  PageModelSchema.extend({
    type: z.literal('static'),
  }),
]);

export const pageRouter = router({
  // Get all pages (both MonitorStatusPage and Page)
  getAllPages: workspaceProcedure
    .meta(
      buildPageOpenapi({
        method: 'GET',
        path: '/all',
        summary: 'Get all pages',
      })
    )
    .input(
      z.object({
        type: z.enum(['status', 'static', 'all']).default('all'),
      })
    )
    .output(z.array(PageInfoSchema))
    .query(async ({ input }) => {
      const { workspaceId, type } = input;

      const results: any[] = [];

      if (type === 'status' || type === 'all') {
        const statusPages = await prisma.monitorStatusPage.findMany({
          where: { workspaceId },
          orderBy: { updatedAt: 'desc' },
        });
        results.push(...statusPages.map((p) => ({ ...p, type: 'status' })));
      }

      if (type === 'static' || type === 'all') {
        const staticPages = await prisma.page.findMany({
          where: { workspaceId },
          orderBy: { updatedAt: 'desc' },
        });
        results.push(...staticPages.map((p) => ({ ...p, type: 'static' })));
      }

      return results.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }),

  // Get page info by slug (check both tables)
  getPageInfo: publicProcedure
    .meta({
      openapi: {
        tags: [OPENAPI_TAG.PAGE],
        method: 'GET',
        protect: false,
        path: '/page/{slug}',
        summary: 'Get page info',
      },
    })
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .output(PageInfoSchema.nullable())
    .query(async ({ input }) => {
      const { slug } = input;

      // Try MonitorStatusPage first
      const statusPage = await prisma.monitorStatusPage.findUnique({
        where: { slug },
      });

      if (statusPage) {
        return { ...statusPage, type: 'status' as const };
      }

      // Try static Page
      const staticPage = await prisma.page.findUnique({
        where: { slug },
      });

      if (staticPage) {
        return { ...staticPage, type: 'static' as const };
      }

      return null;
    }),

  // Create page (support both types)
  createPage: workspaceAdminProcedure
    .meta(
      buildPageOpenapi({
        method: 'POST',
        path: '/create',
        summary: 'Create page',
      })
    )
    .input(
      z
        .object({
          slug: z.string(),
          title: z.string(),
          type: z.enum(['status', 'static']).default('static'),
        })
        .and(
          z.union([
            // Status page fields
            z.object({
              type: z.literal('status'),
              description: z.string().optional(),
              body: z.any().optional(),
              monitorList: z.any().optional(),
              domain: z.string().optional(),
            }),
            // Static page fields
            z.object({
              type: z.literal('static'),
              description: z.string().optional(),
              domain: z.string().optional(),
              payload: z.any().optional(),
            }),
          ])
        )
    )
    .output(PageInfoSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, slug, title, type } = input;

      // Check slug uniqueness across both tables
      const [statusSlugCount, staticSlugCount] = await Promise.all([
        prisma.monitorStatusPage.count({ where: { slug } }),
        prisma.page.count({ where: { slug } }),
      ]);

      if (statusSlugCount > 0 || staticSlugCount > 0) {
        throw new Error('This slug has been existed');
      }

      const domain = (input as any).domain;
      if (domain && !(await customDomainManager.checkDomain(domain))) {
        throw new Error('This domain has been used');
      }

      if (type === 'status') {
        const { description, body, monitorList } = input as any;
        const page = await prisma.monitorStatusPage.create({
          data: {
            workspaceId,
            slug,
            title,
            description,
            body,
            monitorList,
            domain: domain || null,
          },
        });

        if (page.domain) {
          customDomainManager.updatePageDomain(page.domain, {
            workspaceId: page.workspaceId,
            pageId: page.id,
            slug: page.slug,
            type: 'status',
          });
        }

        return { ...page, type: 'status' as const };
      } else {
        const { description, payload } = input as any;
        const page = await prisma.page.create({
          data: {
            workspaceId,
            slug,
            title,
            type: 'static',
            description,
            domain: domain || null,
            payload: payload || {},
          },
        });

        if (page.domain) {
          customDomainManager.updatePageDomain(page.domain, {
            workspaceId: page.workspaceId,
            pageId: page.id,
            slug: page.slug,
            type: 'static',
          });
        }

        return { ...page, type: 'static' as const };
      }
    }),

  // Edit page (detect type by id)
  editPage: workspaceAdminProcedure
    .meta(
      buildPageOpenapi({
        method: 'PATCH',
        path: '/edit',
        summary: 'Edit page',
      })
    )
    .input(
      z.object({
        id: z.string(),
        slug: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        domain: z.string().optional(),
        // Status page specific
        body: z.any().optional(),
        monitorList: z.any().optional(),
        // Static page specific
        payload: z.any().optional(),
      })
    )
    .output(PageInfoSchema)
    .mutation(async ({ input }) => {
      const { id, workspaceId, slug, domain } = input;

      // Try to find in MonitorStatusPage first
      const statusPage = await prisma.monitorStatusPage.findUnique({
        where: { id, workspaceId },
      });

      if (statusPage) {
        // Check slug uniqueness
        if (slug && slug !== statusPage.slug) {
          const [statusCount, staticCount] = await Promise.all([
            prisma.monitorStatusPage.count({
              where: { slug, id: { not: id } },
            }),
            prisma.page.count({ where: { slug } }),
          ]);

          if (statusCount > 0 || staticCount > 0) {
            throw new Error('This slug has been existed');
          }
        }

        if (domain && !(await customDomainManager.checkDomain(domain, id))) {
          throw new Error('This domain has been used by others');
        }

        const { title, description, body, monitorList } = input;
        const updated = await prisma.monitorStatusPage.update({
          where: { id, workspaceId },
          data: {
            slug,
            title,
            description,
            body,
            monitorList,
            domain: domain || null,
          },
        });

        if (updated.domain) {
          customDomainManager.updatePageDomain(updated.domain, {
            workspaceId: updated.workspaceId,
            pageId: updated.id,
            slug: updated.slug,
            type: 'status',
          });
        }

        return { ...updated, type: 'status' as const };
      }

      // Try static Page
      const staticPage = await prisma.page.findUnique({
        where: { id, workspaceId },
      });

      if (staticPage) {
        // Check slug uniqueness
        if (slug && slug !== staticPage.slug) {
          const [statusCount, staticCount] = await Promise.all([
            prisma.monitorStatusPage.count({ where: { slug } }),
            prisma.page.count({
              where: { slug, id: { not: id } },
            }),
          ]);

          if (statusCount > 0 || staticCount > 0) {
            throw new Error('This slug has been existed');
          }
        }

        if (domain && !(await customDomainManager.checkDomain(domain, id))) {
          throw new Error('This domain has been used by others');
        }

        const { title, description, payload } = input;
        const updated = await prisma.page.update({
          where: { id, workspaceId },
          data: {
            slug,
            title,
            description,
            domain: domain || null,
            payload,
          },
        });

        if (updated.domain) {
          customDomainManager.updatePageDomain(updated.domain, {
            workspaceId: updated.workspaceId,
            pageId: updated.id,
            slug: updated.slug,
            type: 'static',
          });
        }

        await invalidateStaticPageCache(updated.slug);
        if (staticPage.slug !== updated.slug) {
          await invalidateStaticPageCache(staticPage.slug);
        }
        return { ...updated, type: 'static' as const };
      }

      throw new Error('Page not found');
    }),

  // Delete page (detect type by id)
  deletePage: workspaceAdminProcedure
    .meta(
      buildPageOpenapi({
        method: 'DELETE',
        path: '/delete',
        summary: 'Delete page',
      })
    )
    .input(
      z.object({
        id: z.string(),
      })
    )
    .output(PageInfoSchema)
    .mutation(async ({ input }) => {
      const { id, workspaceId } = input;

      // Try MonitorStatusPage first
      const statusPage = await prisma.monitorStatusPage.findUnique({
        where: { id, workspaceId },
      });

      if (statusPage) {
        const deleted = await prisma.monitorStatusPage.delete({
          where: { id, workspaceId },
        });
        return { ...deleted, type: 'status' as const };
      }

      // Try static Page
      const staticPage = await prisma.page.findUnique({
        where: { id, workspaceId },
      });

      if (staticPage) {
        const deleted = await prisma.page.delete({
          where: { id, workspaceId },
        });
        await invalidateStaticPageCache(staticPage.slug);
        return { ...deleted, type: 'static' as const };
      }

      throw new Error('Page not found');
    }),
});

function buildPageOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.PAGE],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}/page${meta.path}`,
    },
  };
}
