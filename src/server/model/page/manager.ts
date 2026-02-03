import { logger } from '../../utils/logger.js';
import { prisma } from '../_client.js';

class CustomDomainManager {
  private customDomainPage: Record<
    string,
    {
      workspaceId: string;
      pageId: string;
      slug: string;
      type: 'status' | 'static';
    }
  > = {}; // key: domain

  constructor() {
    this.loadCustomDomains();
  }

  private async loadCustomDomains() {
    try {
      const [monitorStatusPages, generalPages] = await Promise.all([
        prisma.monitorStatusPage.findMany({
          where: {
            domain: {
              not: null,
            },
          },
          select: {
            id: true,
            domain: true,
            workspaceId: true,
            slug: true,
          },
        }),
        prisma.page.findMany({
          where: {
            domain: {
              not: null,
            },
          },
          select: {
            id: true,
            domain: true,
            workspaceId: true,
            slug: true,
          },
        }),
      ]);

      monitorStatusPages.forEach((item) => {
        if (!item.domain) {
          return;
        }
        this.customDomainPage[item.domain] = {
          pageId: item.id,
          workspaceId: item.workspaceId,
          slug: item.slug,
          type: 'status',
        };
      });
      generalPages.forEach((item) => {
        if (!item.domain) {
          return;
        }
        this.customDomainPage[item.domain] = {
          pageId: item.id,
          workspaceId: item.workspaceId,
          slug: item.slug,
          type: 'static',
        };
      });

      logger.info(
        `Loaded ${monitorStatusPages.length + generalPages.length} custom domain for pages (${monitorStatusPages.length} monitor status pages, ${generalPages.length} general pages)`
      );
    } catch (err) {
      logger.error('Cannot load page domain list:', err);
    }
  }

  /**
   * check domain existed
   * if domain not been used, return true
   */
  async checkDomain(domain: string, excludePageId?: string) {
    const [monitorStatusPage, generalPage] = await Promise.all([
      prisma.monitorStatusPage.findFirst({
        where: {
          domain,
          id: {
            notIn: excludePageId ? [excludePageId] : [],
          },
        },
      }),
      prisma.page.findFirst({
        where: {
          domain,
          id: {
            notIn: excludePageId ? [excludePageId] : [],
          },
        },
      }),
    ]);

    return !monitorStatusPage && !generalPage;
  }

  async updatePageDomain(
    domain: string,
    info: {
      workspaceId: string;
      pageId: string;
      slug: string;
      type?: 'status' | 'static';
    }
  ) {
    this.customDomainPage[domain] = {
      ...info,
      type: info.type ?? 'static',
    };
    logger.info(`Update page domain: ${domain} to page ${info.pageId}`);
  }

  findPageDomain(domain: string) {
    if (!this.customDomainPage[domain]) {
      return null;
    }

    return this.customDomainPage[domain];
  }
}

export const customDomainManager = new CustomDomainManager();
