import { logger } from '../../../utils/logger';
import { prisma } from '../../_client';

class MonitorPageManager {
  private customDomainPage: Record<
    string,
    {
      workspaceId: string;
      pageId: string;
      slug: string;
    }
  > = {}; // key: domain

  constructor() {
    prisma.monitorStatusPage
      .findMany({
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
      })
      .then((res) => {
        res.forEach((item) => {
          if (!item.domain) {
            return;
          }

          this.customDomainPage[item.domain] = {
            pageId: item.id,
            workspaceId: item.workspaceId,
            slug: item.slug,
          };
        });

        logger.info(`Loaded ${res.length} custom domain for status page`);
      })
      .catch((err) => {
        logger.error('Cannot load monitor page domain list:', err);
      });
  }

  /**
   * check domain existed
   * if domain not been used, return true
   */
  async checkDomain(domain: string, excludeMonitorId?: string) {
    const res = await prisma.monitorStatusPage.findFirst({
      where: {
        domain,
        id: {
          notIn: excludeMonitorId ? [excludeMonitorId] : [],
        },
      },
    });

    return !res;
  }

  async updatePageDomain(
    domain: string,
    info: {
      workspaceId: string;
      pageId: string;
      slug: string;
    }
  ) {
    this.customDomainPage[domain] = info;
    logger.info(`Update page domain: ${domain} to page ${info.pageId}`);
  }

  findPageDomain(domain: string) {
    if (!this.customDomainPage[domain]) {
      return null;
    }

    return this.customDomainPage[domain];
  }
}

export const monitorPageManager = new MonitorPageManager();
