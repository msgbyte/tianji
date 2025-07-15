import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import React from 'react';
import { cn } from '@/lib/utils';

interface ChangelogItem {
  date: string;
  version?: string;
  title: string;
  description: string | string[];
  type: 'current' | 'release' | 'milestone' | 'start';
}

const changelogData: ChangelogItem[] = [
  {
    date: 'now',
    title: 'Still Developing',
    description:
      'We have been continuously focusing on exploring the needs in this field and growing continuously. Just like you.',
    type: 'current',
  },
  {
    date: '2025/07/15',
    version: 'v1.24.0',
    title: 'ClickHouse Infrastructure',
    description:
      'Add ClickHouse infrastructure and support for better analytics performance',
    type: 'release',
  },
  {
    date: '2025/07/06',
    version: 'v1.23.0',
    title: 'Server Status Enhancement',
    description:
      'Add server status display in status page for better monitoring',
    type: 'release',
  },
  {
    date: '2025/06/18',
    version: 'v1.22.0',
    title: 'OpenAI Environment Variables',
    description:
      'Breaking change: Updated OPENAI_* environment variable naming convention',
    type: 'release',
  },
  {
    date: '2025/05/25',
    version: 'v1.21.0',
    title: 'Enhanced Monitoring',
    description: 'Add push monitor and cron monitor capabilities',
    type: 'release',
  },
  {
    date: '2025/04/14',
    version: 'v1.20.0',
    title: 'AI Gateway',
    description: 'Introduced AI Gateway for intelligent request handling',
    type: 'release',
  },
  {
    date: '2025/03/22',
    version: 'v1.19.0',
    title: 'Application Module',
    description:
      'Added comprehensive Application module for better project management',
    type: 'release',
  },
  {
    date: '2025/02/02',
    version: 'v1.18.0',
    title: 'Survey AI Tools',
    description: 'Integrated AI-powered survey analysis and insights',
    type: 'release',
  },
  {
    date: '2024/11/19',
    version: 'v1.17.0',
    title: 'Subscription System',
    description: 'Implemented flexible subscription and billing system',
    type: 'release',
  },
  {
    date: '2024/10/19',
    version: 'v1.16.0',
    title: 'Monitor Improvements',
    description: [
      'Add monitor summary dashboard',
      'Enhance monitor page display and UX',
    ],
    type: 'release',
  },
  {
    date: '2024/09/18',
    version: 'v1.15.0',
    title: 'Lighthouse Integration',
    description: 'Add Lighthouse performance monitoring capabilities',
    type: 'release',
  },
  {
    date: '2024/08/29',
    version: 'v1.14.0',
    title: 'Workspace Management',
    description: [
      'Workspace switching and creation',
      'Team collaboration with workspace invites',
    ],
    type: 'release',
  },
  {
    date: '2024/08/11',
    version: 'v1.13.0',
    title: 'Auth Framework Overhaul',
    description: 'Complete authentication system rebuild with AuthJS backend',
    type: 'release',
  },
  {
    date: '2024/07/22',
    version: 'v1.12.0',
    title: 'Channel Feed',
    description: 'Introduced real-time channel feed functionality',
    type: 'release',
  },
  {
    date: '2024/05/20',
    version: 'v1.11.0',
    title: 'UI/UX Refresh',
    description: [
      'New server Docker view interface',
      'Complete homepage redesign',
    ],
    type: 'release',
  },
  {
    date: '2024/05/15',
    version: 'v1.10.0',
    title: 'Survey System',
    description: 'Launch comprehensive survey and feedback collection system',
    type: 'release',
  },
  {
    date: '2024/04/22',
    version: 'v1.9.0',
    title: 'Custom Domains & i18n',
    description: [
      'Custom domain support for status pages',
      'Added Polish language support',
    ],
    type: 'release',
  },
  {
    date: '2024/04/09',
    version: 'v1.8.0',
    title: 'Major Design Update',
    description: [
      'Complete UI/UX redesign',
      'Added Portuguese language support',
    ],
    type: 'release',
  },
  {
    date: '2024/03/08',
    version: 'v1.7.0',
    title: 'Telemetry & Optimization',
    description: [
      'Launch telemetry analytics feature',
      'Docker image size reduced by 40%',
    ],
    type: 'release',
  },
  {
    date: '2024/02/15',
    version: 'v1.6.0',
    title: 'Global & Reliability',
    description: [
      'Internationalization (i18n) support',
      'HTTP monitor timeout settings',
      'Network fluctuation protection with max retries',
    ],
    type: 'release',
  },
  {
    date: '2024/02/01',
    version: 'v1.5.0',
    title: 'Analytics & Auditing',
    description: [
      'Interactive visitor map visualization',
      'Comprehensive audit logging',
      'Previous period comparison in website overview',
    ],
    type: 'release',
  },
  {
    date: '2024/01/14',
    version: 'v1.4.0',
    title: 'Notifications & Monitoring',
    description: [
      'Apprise notification integration',
      'TCP port monitoring',
      'Real-time response values',
      'ARM64 architecture support',
    ],
    type: 'release',
  },
  {
    date: '2024/01/09',
    version: 'v1.3.0',
    title: 'Badges & Communications',
    description: [
      'Monitor status badges',
      'Telegram notification support',
      'Smart notification tokenizer',
      'Editable dashboard cards',
    ],
    type: 'release',
  },
  {
    date: '2024/01/01',
    version: 'v1.2.0',
    title: 'Custom Monitor Logic',
    description:
      'Revolutionary custom monitor system with JavaScript programming capabilities',
    type: 'release',
  },
  {
    date: '2023/12/30',
    version: 'v1.1.0',
    title: 'Data Management',
    description: [
      'Monitor data deletion capabilities',
      'Improved monitor ordering system',
      'HTTP header validation fixes',
    ],
    type: 'release',
  },
  {
    date: '2023/12/25',
    title: 'Open Source Release! 🎉',
    description:
      'Tianji becomes open source to help developers worldwide. Open source is in our DNA.',
    type: 'milestone',
  },
  {
    date: '2023/11/9',
    title: 'Alpha Testing Begins',
    description:
      'Started private alpha testing with selected community members',
    type: 'milestone',
  },
  {
    date: '2023/10/01',
    title: 'Project Genesis',
    description:
      'The beginning of our journey to revolutionize monitoring and analytics',
    type: 'start',
  },
];

const getItemStyles = (type: string) => {
  switch (type) {
    case 'current':
      return {
        accent: 'from-blue-500 to-cyan-400',
        bg: 'bg-gradient-to-br from-blue-500/10 to-cyan-400/10',
        border: 'border-blue-400/30',
        icon: '🚀',
      };
    case 'milestone':
      return {
        accent: 'from-purple-500 to-pink-400',
        bg: 'bg-gradient-to-br from-purple-500/10 to-pink-400/10',
        border: 'border-purple-400/30',
        icon: '🎯',
      };
    case 'start':
      return {
        accent: 'from-green-500 to-emerald-400',
        bg: 'bg-gradient-to-br from-green-500/10 to-emerald-400/10',
        border: 'border-green-400/30',
        icon: '✨',
      };
    default:
      return {
        accent: 'from-slate-500 to-slate-400',
        bg: 'bg-gradient-to-br from-slate-500/5 to-slate-400/5',
        border: 'border-slate-400/20',
        icon: '📦',
      };
  }
};

function TimelineItem({ item, index }: { item: ChangelogItem; index: number }) {
  const styles = getItemStyles(item.type);
  const isArray = Array.isArray(item.description);

  return (
    <div className="group relative flex items-start">
      {/* Timeline line */}
      <div className="absolute bottom-0 left-6 top-16 w-0.5 bg-gradient-to-b from-slate-600/50 to-transparent"></div>

      {/* Timeline dot */}
      <div
        className={cn(
          'relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110',
          styles.accent
        )}
      >
        <span className="text-xl">{styles.icon}</span>
      </div>

      {/* Content */}
      <div
        className={cn(
          'ml-8 flex-1 rounded-xl border p-6 backdrop-blur-sm transition-all duration-300 group-hover:border-opacity-50',
          styles.bg,
          styles.border
        )}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="mb-1 bg-white bg-clip-text text-xl font-bold text-white transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 group-hover:text-transparent">
              {item.title}
            </h3>
            {item.version && (
              <span
                className={cn(
                  'inline-block rounded-full bg-gradient-to-r px-3 py-1 text-sm font-medium text-white shadow-sm',
                  styles.accent
                )}
              >
                {item.version}
              </span>
            )}
          </div>
          <time className="rounded-full bg-slate-800/50 px-3 py-1 text-sm font-medium text-slate-400">
            {item.date}
          </time>
        </div>

        {/* Description */}
        <div className="leading-relaxed text-slate-300">
          {isArray ? (
            <ul className="space-y-2">
              {(item.description as string[]).map((desc, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-3 mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400"></span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{item.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Timeline() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20"></div>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="#ffffff" fill-opacity="0.03"><circle cx="30" cy="30" r="1"/></g></g></svg>')}")`,
            backgroundRepeat: 'repeat',
          }}
        ></div>

        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-5xl font-bold leading-normal text-transparent md:text-6xl md:leading-normal">
            Changelog
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-slate-400">
            Follow Tianji's evolution from conception to the powerful monitoring
            platform it is today. Every update, every improvement, every
            milestone in our journey.
          </p>

          {/* Floating elements */}
          <div className="absolute left-10 top-20 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-400/10 blur-xl"></div>
          <div className="absolute bottom-20 right-10 h-40 w-40 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-400/10 blur-xl"></div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mx-auto max-w-4xl px-6 pb-20 pt-10">
        <div className="space-y-8">
          {changelogData.map((item, index) => (
            <TimelineItem key={index} item={item} index={index} />
          ))}
        </div>

        {/* End marker */}
        <div className="mt-16 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-400 shadow-lg">
            <span className="text-xl">🌱</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Changelog(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={'Changelog'} description="Insight into everything">
      <Timeline />
    </Layout>
  );
}
