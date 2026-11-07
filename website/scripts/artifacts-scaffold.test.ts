import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { createArtifactPreview } from '../../src/client/components/artifact/preview';

const websiteRequire = createRequire(
  path.resolve(__dirname, '../package.json')
);
const tar = websiteRequire('tar');
const { buildArtifactsSkill } = websiteRequire(
  './scripts/build-artifacts-skill.cjs'
);
const clientRequire = createRequire(
  path.resolve(__dirname, '../../src/client/package.json')
);
const { chromium } = clientRequire('playwright');

// Explicit integration check: installs real dependencies and requires Chromium.
test(
  'downloaded starter builds an interactive, self-contained Tianji artifact',
  { timeout: 180000 },
  async () => {
    const temp = await fs.mkdtemp(
      path.join(os.tmpdir(), 'tianji-artifact-build-')
    );
    const run = (command: string, args: string[], cwd = temp) =>
      execFileSync(command, args, {
        cwd,
        encoding: 'utf8',
        timeout: 90000,
        stdio: 'pipe',
      });
    try {
      const archive = path.join(temp, 'skill.tar.gz');
      await buildArtifactsSkill(archive);
      await tar.x({ file: archive, cwd: temp });
      const skill = path.join(temp, 'tianji-artifacts');
      const project = path.join(temp, 'report with spaces');
      run('bash', [path.join(skill, 'scripts/init-artifact.sh'), project]);
      const appPath = path.join(project, 'src/App.tsx');
      const app = await fs.readFile(appPath, 'utf8');
      await fs.writeFile(
        path.join(project, 'src/image.svg'),
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><rect width="12" height="12" fill="red"/></svg>'
      );
      await fs.writeFile(
        appPath,
        `import image from './image.svg';\n${app.replace('<h1 ', '<img src={image} alt="Embedded image" /><h1 ')}`
      );
      run('bash', [path.join(skill, 'scripts/bundle-artifact.sh')], project);
      const bundlePath = path.join(project, 'bundle.html');
      const html = await fs.readFile(bundlePath, 'utf8');
      assert.ok(Buffer.byteLength(html) < 1024 * 1024);

      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage();
        const requests: string[] = [];
        const errors: string[] = [];
        page.on('request', (request: { url(): string }) =>
          requests.push(request.url())
        );
        page.on('pageerror', (error: Error) => errors.push(error.message));
        page.on('console', (message: { type(): string; text(): string }) => {
          if (message.type() === 'error') errors.push(message.text());
        });
        await page.setContent('<!doctype html><title>Artifact host</title>');
        await page.evaluate((srcDoc: string) => {
          const frame = document.createElement('iframe');
          frame.setAttribute('sandbox', 'allow-scripts');
          frame.srcdoc = srcDoc;
          document.body.append(frame);
        }, createArtifactPreview(html));
        const frame = page.frameLocator('iframe');
        await frame.getByRole('button', { name: 'Clicks: 0' }).click();
        await frame.getByRole('button', { name: 'Clicks: 1' }).waitFor();
        assert.equal(
          await frame
            .locator('h1')
            .evaluate((node: Element) => getComputedStyle(node).fontSize),
          '30px'
        );
        assert.equal(
          await frame
            .getByAltText('Embedded image')
            .evaluate(
              (node: HTMLImageElement) => node.complete && node.naturalWidth
            ),
          12
        );
        assert.deepEqual(requests, []);
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }

      await fs.mkdir(path.join(project, 'public'));
      await fs.writeFile(
        path.join(project, 'public/unbundled.txt'),
        'External asset'
      );
      assert.throws(
        () => run('pnpm', ['build'], project),
        /must contain only HTML/
      );
      assert.equal(await fs.readFile(bundlePath, 'utf8'), html);
      await fs.rm(path.join(project, 'public'), { recursive: true });

      await fs.writeFile(
        path.join(project, 'src/large.json'),
        JSON.stringify('x'.repeat(1024 * 1024))
      );
      await fs.writeFile(
        appPath,
        "import data from './large.json';\nexport default function App() { return <pre>{data}</pre>; }\n"
      );
      assert.throws(
        () => run('pnpm', ['build'], project),
        /Tianji accepts at most 1048576 bytes/
      );
      assert.equal(await fs.readFile(bundlePath, 'utf8'), html);
      console.log(
        `Verified extracted Skill, React interaction, Tailwind, embedded SVG, no network requests, extra-file rejection, and size limit (${Buffer.byteLength(html)} byte starter).`
      );
    } finally {
      await fs.rm(temp, { recursive: true, force: true });
    }
  }
);
