import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(
  new URL('./infisical-bootstrap.mjs', import.meta.url)
);
const encryptedClientSecret =
  'AdvCIQloEMDk4epojDPBZvlhOYH3DjCOxbgJ1ZSptt3DyNSys62mSX6Aj9aI6WF/1eb1';

async function createFixture() {
  const fixtureDir = await mkdtemp(join(tmpdir(), 'infisical-bootstrap-test-'));
  const packageDir = join(
    fixtureDir,
    'node_modules',
    '@infisical',
    'sdk'
  );
  await mkdir(packageDir, { recursive: true });
  await cp(scriptPath, join(fixtureDir, 'run.mjs'));
  await writeFile(
    join(packageDir, 'package.json'),
    JSON.stringify({
      name: '@infisical/sdk',
      type: 'module',
      exports: './index.mjs',
    })
  );
  await writeFile(
    join(packageDir, 'index.mjs'),
    `
export class InfisicalSDK {
  constructor(options = {}) {
    if (
      process.env.EXPECTED_SITE_URL &&
      options.siteUrl !== process.env.EXPECTED_SITE_URL
    ) {
      throw new Error('unexpected site URL');
    }
  }

  auth() {
    return {
      universalAuth: {
        login: async ({ clientSecret }) => {
          if (process.env.HANG_LOGIN === 'true') {
            await new Promise((resolve) => setTimeout(resolve, 60_000));
          }
          if (clientSecret !== process.env.EXPECTED_CLIENT_SECRET) {
            throw new Error('unexpected client secret');
          }
        },
      },
    };
  }

  secrets() {
    return {
      listSecrets: async () => {
        if (process.env.HANG_LIST === 'true') {
          await new Promise((resolve) => setTimeout(resolve, 60_000));
        }
        return {
          secrets: [{ secretKey: 'APP_SECRET', secretValue: 'loaded' }],
        };
      },
    };
  }
}
`
  );
  return fixtureDir;
}

async function runBootstrap(extraEnv = {}, timeoutMs = 18_000) {
  const fixtureDir = await createFixture();
  const child = spawn(
    process.execPath,
    [
      join(fixtureDir, 'run.mjs'),
      process.execPath,
      '-e',
      'console.log(JSON.stringify({ appSecret: process.env.APP_SECRET, hasBootstrapSecret: "INFISICAL_US_CLIENT_SECRET_ENC" in process.env }))',
    ],
    {
      env: {
        PATH: process.env.PATH,
        INFISICAL_US_BOOTSTRAP_ENABLED: 'true',
        INFISICAL_US_CLIENT_ID: 'test-client-id',
        INFISICAL_US_CLIENT_SECRET_ENC: encryptedClientSecret,
        INFISICAL_US_ENV: 'test',
        INFISICAL_US_PROJECT_ID: 'test-project-id',
        INFISICAL_US_SECRET_PATH: '/test',
        EXPECTED_CLIENT_SECRET: 'st.uam-cs.test-fixture',
        ...extraEnv,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let stdout = '';
  let stderr = '';
  let killedByHarness = false;
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  const timer = setTimeout(() => {
    killedByHarness = true;
    child.kill('SIGKILL');
  }, timeoutMs);
  const startedAt = Date.now();

  try {
    const result = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code, signal) => {
        resolve({
          code,
          signal,
          stdout,
          stderr,
          elapsedMs: Date.now() - startedAt,
          killedByHarness,
        });
      });
    });
    return result;
  } finally {
    clearTimeout(timer);
    await rm(fixtureDir, { recursive: true, force: true });
  }
}

test('decrypts the Flow-compatible client secret before authentication', async () => {
  const result = await runBootstrap();

  assert.equal(result.code, 0, result.stderr);
  assert.match(
    result.stdout,
    /"appSecret":"loaded","hasBootstrapSecret":false/
  );
});

test('passes the configured Infisical site URL to the SDK', async () => {
  const result = await runBootstrap({
    INFISICAL_SITE_URL: 'https://infisical.example.test',
    EXPECTED_SITE_URL: 'https://infisical.example.test',
  });

  assert.equal(result.code, 0, result.stderr);
});

test('uses Infisical Cloud when no site URL is configured', async () => {
  const result = await runBootstrap({
    EXPECTED_SITE_URL: 'https://app.infisical.com',
  });

  assert.equal(result.code, 0, result.stderr);
});

test('fails authentication within the 15 second bootstrap timeout', async () => {
  const result = await runBootstrap({ HANG_LOGIN: 'true' });

  assert.equal(result.killedByHarness, false);
  assert.equal(result.code, 1);
  assert.ok(result.elapsedMs >= 14_000, `exited after ${result.elapsedMs}ms`);
  assert.ok(result.elapsedMs < 17_500, `exited after ${result.elapsedMs}ms`);
  assert.match(result.stderr, /authentication failed/);
});

test('fails secret loading within the 15 second bootstrap timeout', async () => {
  const result = await runBootstrap({ HANG_LIST: 'true' });

  assert.equal(result.killedByHarness, false);
  assert.equal(result.code, 1);
  assert.ok(result.elapsedMs >= 14_000, `exited after ${result.elapsedMs}ms`);
  assert.ok(result.elapsedMs < 17_500, `exited after ${result.elapsedMs}ms`);
  assert.match(result.stderr, /secret loading failed/);
});
