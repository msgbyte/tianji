#!/usr/bin/env ts-node
/**
 * Generate a single llms.txt file by collecting Docusaurus content.
 * - Scans markdown sources: website/docs, website/blog, website/src/pages
 * - Strips frontmatter and MDX import/export statements
 * - Flattens most MDX JSX elements while preserving inner text
 * - Keeps code fences, headings, links and images as Markdown
 * - Writes merged content to website/static/llms.txt
 *
 * Inspired by Mantine's compiler:
 * https://raw.githubusercontent.com/mantinedev/mantine/ddae40ed58986b1260e8422771ac04c1ed95e58b/scripts/llm/compile-llm-doc.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Resolve website root relative to this script location to avoid relying on cwd
const WEBSITE_ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  path.join(WEBSITE_ROOT, 'docs'),
  path.join(WEBSITE_ROOT, 'src', 'pages'),
];
const OUTPUT_TITLES_FILE = path.join(WEBSITE_ROOT, 'static', 'llms.txt');
const OUTPUT_FULL_FILE = path.join(WEBSITE_ROOT, 'static', 'llms-full.txt');
const ALLOWED_EXTENSIONS = new Set(['.md', '.mdx']);

async function fileExists(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.stat(filePath, (err) => resolve(!err));
  });
}

function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function collectFiles(dir: string, out: string[] = []): string[] {
  if (!isDirectory(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        collectFiles(full, out);
      } else if (stat.isFile()) {
        const ext = path.extname(full).toLowerCase();
        if (ALLOWED_EXTENSIONS.has(ext)) out.push(full);
      }
    } catch {
      // ignore
    }
  }
  return out;
}

function stripFrontmatter(src: string): string {
  // Remove YAML frontmatter at the very beginning of the file
  return src.replace(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)/, '');
}

function stripMdxEsm(src: string): string {
  // Remove MDX ESM import/export at start of line
  return src.replace(/^\s*(import|export)\s[\s\S]*?;\s*$/gm, '');
}

function flattenMdxJsx(src: string): string {
  // Replace MDX JSX blocks with their inner text when possible
  // <Component ...>inner</Component> -> inner
  let out = src.replace(/<([A-Z][\w.-]*)([^>]*)>([\s\S]*?)<\/\1>/g, '$3');
  // Self-closing MDX JSX: <Component .../> -> ''
  out = out.replace(/<([A-Z][\w.-]*)([^>]*)\/>/g, '');
  return out;
}

function sanitizeContent(src: string): string {
  let out = src;
  out = stripFrontmatter(out);
  out = stripMdxEsm(out);
  out = flattenMdxJsx(out);
  // Normalize Windows newlines just in case
  out = out.replace(/\r\n/g, '\n');
  // Collapse 3+ empty lines to 2
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim() + '\n';
}

/**
 * Try to read docusaurus config to get site url and baseUrl
 */
function readSiteConfig(): { url: string; baseUrl: string } {
  const fallback = { url: 'https://tianji.dev', baseUrl: '/' };
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require(path.join(WEBSITE_ROOT, 'docusaurus.config'));
    const url = cfg?.url || fallback.url;
    const baseUrl = cfg?.baseUrl || fallback.baseUrl;
    return { url, baseUrl };
  } catch {
    return fallback;
  }
}

/**
 * Extract title from frontmatter if present.
 */
function extractTitleFromFrontmatter(src: string): string | '' {
  const fmMatch = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return '';
  const fm = fmMatch[1];
  const titleMatch = fm.match(/^title:\s*(.*)$/m);
  if (!titleMatch) return '';
  return titleMatch[1].replace(/^['"`]?(.*)['"`]?$/, '$1').trim();
}

/**
 * Extract first markdown H1 as title.
 */
function extractH1Title(src: string): string | '' {
  const m = src.match(/^\s*#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : '';
}

/**
 * Fallback: create readable title from file path.
 */
function deriveTitleFromPath(absPath: string, baseDir: string): string {
  const rel = path.relative(baseDir, absPath);
  const noExt = rel.replace(/\.(md|mdx)$/i, '');
  const parts = noExt.split(path.sep).filter(Boolean);
  let base = parts[parts.length - 1] || 'Untitled';
  if (base.toLowerCase() === 'index' && parts.length > 1) {
    base = parts[parts.length - 2];
  }
  return base.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * Compute public route from file path for docs and pages.
 */
function computeRouteForFile(
  absPath: string,
  roots: { docs: string; pages: string },
  baseUrl: string
): string {
  const toPosix = (p: string) => p.split(path.sep).join('/');
  const ensureSlash = (p: string) => (p.endsWith('/') ? p : p + '/');
  if (absPath.startsWith(roots.docs + path.sep) || absPath === roots.docs) {
    const rel = path.relative(roots.docs, absPath);
    const noExt = rel.replace(/\.(md|mdx)$/i, '');
    const segments = noExt.split(path.sep).filter(Boolean);
    if (
      segments.length &&
      segments[segments.length - 1].toLowerCase() === 'index'
    ) {
      segments.pop();
    }
    const route = ensureSlash(baseUrl) + 'docs/' + toPosix(segments.join('/'));
    return route.replace(/\/$/, '') || ensureSlash(baseUrl) + 'docs';
  }
  if (absPath.startsWith(roots.pages + path.sep) || absPath === roots.pages) {
    const rel = path.relative(roots.pages, absPath);
    const noExt = rel.replace(/\.(md|mdx)$/i, '');
    const segments = noExt.split(path.sep).filter(Boolean);
    if (
      segments.length &&
      segments[segments.length - 1].toLowerCase() === 'index'
    ) {
      segments.pop();
    }
    const route = '/' + toPosix(segments.join('/'));
    return route === '/'
      ? ensureSlash(baseUrl)
      : ensureSlash(baseUrl) + route.replace(/^\//, '');
  }
  return ensureSlash(baseUrl);
}

async function main() {
  const existingTargets = (
    await Promise.all(
      TARGETS.map(async (p) => ((await fileExists(p)) ? p : ''))
    )
  ).filter(Boolean) as string[];

  const files = existingTargets.flatMap((dir) => collectFiles(dir)).sort();

  const headerFull = [
    '# Tianji Documentation Export (Full)',
    '',
    'This file aggregates documentation for LLM consumption.',
    'It preserves Markdown headings, links, and code fences; frontmatter and MDX ESM are removed.',
    '',
    '='.repeat(80),
    '',
  ].join('\n');

  const chunksFull: string[] = [headerFull];

  const { url: siteUrl, baseUrl } = readSiteConfig();
  const docsRoot = path.join(WEBSITE_ROOT, 'docs');
  const pagesRoot = path.join(WEBSITE_ROOT, 'src', 'pages');
  const routes: Array<{ title: string; url: string }> = [];

  for (const absPath of files) {
    let content = '';
    try {
      content = fs.readFileSync(absPath, 'utf-8');
    } catch {
      continue;
    }

    const relPath = path.relative(WEBSITE_ROOT, absPath);
    const sanitized = sanitizeContent(content);
    const sectionHeader = [`===== FILE: ${relPath} =====`, ''].join('\n');
    chunksFull.push(sectionHeader, sanitized, '');

    // Build titles list
    const titleFromFm = extractTitleFromFrontmatter(content);
    const titleFromH1 = titleFromFm || extractH1Title(content);
    const title =
      titleFromH1 ||
      deriveTitleFromPath(
        absPath,
        absPath.includes('/src/pages') ? pagesRoot : docsRoot
      );
    const routePath = computeRouteForFile(
      absPath,
      { docs: docsRoot, pages: pagesRoot },
      baseUrl
    );
    const absoluteUrl =
      siteUrl.replace(/\/+$/, '') + '/' + routePath.replace(/^\//, '');
    routes.push({ title, url: absoluteUrl });
  }

  const outputFull = chunksFull.join('\n');
  const headerTitles = [
    '# Tianji Documentation Index',
    '',
    'This file lists documentation titles with absolute URLs.',
    '',
    '='.repeat(80),
    '',
  ].join('\n');
  const outputTitles =
    [headerTitles, ...routes.map((r) => `${r.title} - ${r.url}`)].join('\n') +
    '\n';

  // Ensure output directory exists
  const outDir = path.join(WEBSITE_ROOT, 'static');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_TITLES_FILE, outputTitles, 'utf-8');
  fs.writeFileSync(OUTPUT_FULL_FILE, outputFull, 'utf-8');

  // eslint-disable-next-line no-console
  console.log(
    `Generated ${path.relative(WEBSITE_ROOT, OUTPUT_TITLES_FILE)} (titles) and ${path.relative(WEBSITE_ROOT, OUTPUT_FULL_FILE)} (full) from ${files.length} files`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate llms.txt', err);
  process.exit(1);
});
