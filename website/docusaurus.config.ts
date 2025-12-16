// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes } from 'prism-react-renderer';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const lightTheme = themes.github;
const darkTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config: Config = {
  title: 'Tianji',
  tagline:
    'All-in-One Insight Hub. Tianji = Website Analytics + Uptime Monitor + Server Status',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://tianji.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'msgbyte', // Usually your GitHub org/user name.
  projectName: 'tianji', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'de', 'id', 'ja', 'zh-Hans', 'es'],
  },

  presets: [
    [
      'docusaurus-preset-openapi',
      /** @type {import('docusaurus-preset-openapi').Options} */
      {
        api: {
          path: './openapi.json',
          routeBasePath: '/api',
        },
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/docs',
          editUrl: 'https://github.com/msgbyte/tianji/tree/master/website/',
        },
        theme: {
          customCss: [
            require.resolve('./src/css/base.css'),
            require.resolve('./src/css/custom.css'),
          ],
        },
        // need .git file, not easy build in vercel with cli, ignore now
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
          createSitemapItems: async (params) => {
            const { defaultCreateSitemapItems, ...rest } = params;
            const items = await defaultCreateSitemapItems(rest);
            return items.filter((item) => !item.url.includes('/page/'));
          },
        },
      },
    ],
  ],

  plugins: [
    require.resolve('docusaurus-plugin-image-zoom'),
    TsConfigPathsPlugin,
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/social-card.png',
    metadata: [
      {
        name: 'keywords',
        content:
          'opensource, free, tianji, umami, uptime, kuma, website, analysis, monitor, serverstatus, status page, docker',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Tianji' },
      { name: 'twitter:site', content: '@moonrailgun' },
      { name: 'twitter:creator', content: '@moonrailgun' },
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Tianji',
      logo: {
        alt: 'Tianji Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        { to: '/pricing', label: 'Pricing', position: 'left' },
        { to: '/changelog', label: 'Changelog', position: 'left' },
        { to: '/api', label: 'API', position: 'left' },
        {
          href: 'https://app-tianji.msgbyte.com/',
          label: 'Cloud',
          position: 'right',
        },
        {
          href: 'https://discord.gg/8Vv47wAEej',
          label: 'Discord',
          position: 'right',
        },
        {
          href: 'https://github.com/msgbyte/tianji',
          label: 'GitHub',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
            {
              label: 'Blog',
              to: '/blog',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/tianji',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/8Vv47wAEej',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/moonrailgun',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Changelog',
              to: '/changelog',
            },
            {
              label: 'API',
              to: '/api',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/msgbyte/tianji',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Tianji, Inc. Built with Msgbyte.`,
    },
    prism: {
      theme: lightTheme,
      darkTheme: darkTheme,
    },
    zoom: {
      selector: '.markdown :not(em) > img',
      background: {
        light: 'rgb(255, 255, 255)',
        dark: 'rgb(50, 50, 50)',
      },
      config: {
        // options you can specify via https://github.com/francoischalifour/medium-zoom#usage
      },
    },
  } satisfies Preset.ThemeConfig,

  scripts: [
    {
      src: 'https://tianji.moonrailgun.com/tracker.js',
      async: true,
      defer: true,
      'data-website-id': 'clopxgjr6050tqn5dzxo7pjac',
    },
  ],
};

module.exports = config;

function TsConfigPathsPlugin(context, options) {
  return {
    name: 'tsconfig-paths-plugin',
    configureWebpack() {
      return {
        resolve: {
          plugins: [new TsconfigPathsPlugin()],
        },
      };
    },
  };
}
