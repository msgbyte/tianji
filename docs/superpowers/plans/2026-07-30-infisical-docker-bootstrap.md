# Infisical Docker Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Tianji Docker image optionally fetch Infisical secrets and expose them only to the container startup process tree.

**Architecture:** Add a small `infisical-bootstrap` image stage that embeds an
ESM bootstrap program with a Dockerfile heredoc and installs the pinned official
SDK into `/opt/infisical-bootstrap`. Copy that isolated directory into the final
image and replace the final command with the bootstrap program wrapping the
existing command; the disabled branch immediately spawns the original command
without contacting Infisical.

**Tech Stack:** Docker BuildKit Dockerfile syntax, Node.js 22, `@infisical/sdk@5.0.2`, Node `child_process`.

## Global Constraints

- Modify only `Dockerfile`; do not modify Tianji package manifests or application source.
- Do not modify JSON files in `src/client/public/locales`.
- Treat `INFISICAL_US_CLIENT_SECRET_ENC` as the Universal Auth client secret without decoding.
- Do not write fetched secrets to disk or print secret keys or values.
- Preserve the original Docker startup behavior when bootstrap is disabled or absent.
- Load only the exact configured secret path, with reference expansion and without recursive child-path loading.
- Fail before application startup if enabled bootstrap configuration, authentication, or secret loading fails.

---

## File structure

- Modify: `Dockerfile`
  - Add a directly buildable `infisical-bootstrap` stage.
  - Pin and install the Infisical SDK in an isolated runtime directory.
  - Embed `/opt/infisical-bootstrap/run.mjs`.
  - Copy the isolated bootstrap runtime into the final image.
  - Wrap the existing `CMD` without changing its inner Tianji command.
- Temporary fake package: `/tmp/tianji-infisical-sdk-fake`
  - Mounted over the image's `@infisical/sdk` directory at the external network
    boundary.
  - Never added to the repository or final image.

### Task 1: Docker bootstrap wrapper

**Files:**

- Modify: `Dockerfile`
- Test: temporary executable harness outside the repository

**Interfaces:**

- Consumes: the six `INFISICAL_US_*` environment variables and a command in `process.argv.slice(2)`.
- Produces: a child process whose environment contains fetched `secretKey`/`secretValue` pairs, excludes all `INFISICAL_US_*` variables, and exits with the child status.

- [ ] **Step 1: Run the image-stage test to verify RED**

Run:

```bash
docker build --target infisical-bootstrap \
  -t tianji:infisical-bootstrap-unit .
```

Expected: FAIL with `target stage "infisical-bootstrap" could not be found`
because the bootstrap image stage does not exist.

- [ ] **Step 2: Add the pinned isolated bootstrap stage**

Immediately after the Node `base` stage declaration, add an independent stage:

```dockerfile
FROM node:22.22-alpine3.23 AS infisical-bootstrap
WORKDIR /opt/infisical-bootstrap

RUN npm install \
      --omit=dev \
      --ignore-scripts \
      --no-audit \
      --no-fund \
      @infisical/sdk@5.0.2
```

The stage must contain no Tianji application files or credentials.

- [ ] **Step 3: Embed the minimal bootstrap implementation**

Add a BuildKit heredoc in the `infisical-bootstrap` stage at
`/opt/infisical-bootstrap/run.mjs`. Add
`# syntax=docker/dockerfile:1` as the first Dockerfile line, then embed:

```dockerfile
COPY <<'EOF' /opt/infisical-bootstrap/run.mjs
import { spawn } from 'node:child_process';
import { InfisicalSDK } from '@infisical/sdk';

const prefix = '[infisical-bootstrap]';
const bootstrapKeys = [
  'INFISICAL_US_BOOTSTRAP_ENABLED',
  'INFISICAL_US_CLIENT_ID',
  'INFISICAL_US_CLIENT_SECRET_ENC',
  'INFISICAL_US_ENV',
  'INFISICAL_US_PROJECT_ID',
  'INFISICAL_US_SECRET_PATH',
];
const requiredKeys = bootstrapKeys.slice(1);
const truthyValues = new Set(['1', 'true', 'yes', 'on']);

const command = process.argv.slice(2);
if (command.length === 0) {
  console.error(`${prefix} no command provided`);
  process.exit(1);
}

const isEnabled = truthyValues.has(
  (process.env.INFISICAL_US_BOOTSTRAP_ENABLED ?? '').trim().toLowerCase()
);
const childEnv = { ...process.env };

if (isEnabled) {
  const missingKeys = requiredKeys.filter(
    (key) => !process.env[key]?.trim()
  );
  if (missingKeys.length > 0) {
    console.error(
      `${prefix} missing required environment variables: ${missingKeys.join(', ')}`
    );
    process.exit(1);
  }

  console.log(`${prefix} bootstrap enabled`);
  const client = new InfisicalSDK();

  try {
    await client.auth().universalAuth.login({
      clientId: process.env.INFISICAL_US_CLIENT_ID,
      clientSecret: process.env.INFISICAL_US_CLIENT_SECRET_ENC,
    });
  } catch {
    console.error(`${prefix} authentication failed`);
    process.exit(1);
  }
  console.log(`${prefix} authentication succeeded`);

  let response;
  try {
    response = await client.secrets().listSecrets({
      environment: process.env.INFISICAL_US_ENV,
      projectId: process.env.INFISICAL_US_PROJECT_ID,
      secretPath: process.env.INFISICAL_US_SECRET_PATH,
      expandSecretReferences: true,
      recursive: false,
      includeImports: false,
      viewSecretValue: true,
    });
  } catch {
    console.error(`${prefix} secret loading failed`);
    process.exit(1);
  }

  if (
    !response ||
    !Array.isArray(response.secrets) ||
    response.secrets.some(
      (secret) =>
        typeof secret?.secretKey !== 'string' ||
        secret.secretKey.length === 0 ||
        typeof secret.secretValue !== 'string'
    )
  ) {
    console.error(`${prefix} invalid secret response`);
    process.exit(1);
  }

  for (const { secretKey, secretValue } of response.secrets) {
    childEnv[secretKey] = secretValue;
  }
  console.log(
    `${prefix} loaded ${response.secrets.length} ${
      response.secrets.length === 1 ? 'secret' : 'secrets'
    }`
  );
  console.log(`${prefix} starting Tianji`);
}

for (const key of Object.keys(childEnv)) {
  if (key.startsWith('INFISICAL_US_')) {
    delete childEnv[key];
  }
}

const child = spawn(command[0], command.slice(1), {
  env: childEnv,
  stdio: 'inherit',
});
const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
const signalHandlers = new Map(
  signals.map((signal) => [
    signal,
    () => {
      if (child.pid) {
        child.kill(signal);
      }
    },
  ])
);

for (const [signal, handler] of signalHandlers) {
  process.on(signal, handler);
}

const removeSignalHandlers = () => {
  for (const [signal, handler] of signalHandlers) {
    process.off(signal, handler);
  }
};

child.once('error', () => {
  removeSignalHandlers();
  console.error(`${prefix} failed to start command`);
  process.exit(1);
});

child.once('exit', (code, signal) => {
  removeSignalHandlers();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
EOF
```

This code rejects an empty command, validates before constructing the client,
sanitizes SDK errors, validates the response, overrides inherited values,
strips bootstrap variables, forwards signals, and propagates child exit status.

- [ ] **Step 4: Build the isolated stage**

Run:

```bash
docker build --target infisical-bootstrap \
  -t tianji:infisical-bootstrap-unit .
```

Expected: PASS and install exactly `@infisical/sdk@5.0.2`.

- [ ] **Step 5: Create the fake SDK at the external boundary**

Use `apply_patch` to create
`/tmp/tianji-infisical-sdk-fake/package.json`:

```json
{
  "name": "@infisical/sdk",
  "type": "module",
  "exports": "./index.mjs"
}
```

Use `apply_patch` to create
`/tmp/tianji-infisical-sdk-fake/index.mjs` with the complete documented response
shape:

```js
export class InfisicalSDK {
  constructor() {
    if (process.env.FAIL_ON_SDK_CONSTRUCT === '1') {
      throw new Error('SDK must not be constructed');
    }
  }

  auth() {
    return {
      universalAuth: {
        login: async ({ clientId, clientSecret }) => {
          if (clientId !== 'client-id' || clientSecret !== 'client-secret') {
            throw new Error('unexpected credentials');
          }
        },
      },
    };
  }

  secrets() {
    return {
      listSecrets: async (options) => {
        if (
          options.environment !== 'prod' ||
          options.projectId !== 'project-id' ||
          options.secretPath !== '/tianji' ||
          options.expandSecretReferences !== true ||
          options.recursive !== false
        ) {
          throw new Error('unexpected list options');
        }

        return {
          secrets: [
            {
              id: 'secret-id',
              workspaceId: 'project-id',
              environment: 'prod',
              secretKey: 'DATABASE_URL',
              secretValue: 'from-infisical',
              secretValueHidden: false,
              isRotatedSecret: false,
              type: 'shared',
              createdAt: '2026-07-30T00:00:00.000Z',
              updatedAt: '2026-07-30T00:00:00.000Z',
              version: 1,
              tags: [],
            },
          ],
        };
      },
    };
  }
}
```

Mount this directory read-only at:

```text
/opt/infisical-bootstrap/node_modules/@infisical/sdk
```

- [ ] **Step 6: Run disabled and validation behavior checks**

Run:

```bash
docker run --rm \
  -e FAIL_ON_SDK_CONSTRUCT=1 \
  -e DATABASE_URL=container \
  -v /tmp/tianji-infisical-sdk-fake:/opt/infisical-bootstrap/node_modules/@infisical/sdk:ro \
  tianji:infisical-bootstrap-unit \
  node -e 'process.exit(process.env.DATABASE_URL === "container" ? 0 : 20)'
```

Expected: exit `0` with no `infisical-bootstrap` log. The fake constructor would
fail if the disabled branch instantiated the SDK.

Run the enabled wrapper with only the flag and a child marker:

```bash
docker run --rm \
  -e INFISICAL_US_BOOTSTRAP_ENABLED=true \
  -v /tmp/tianji-infisical-sdk-fake:/opt/infisical-bootstrap/node_modules/@infisical/sdk:ro \
  tianji:infisical-bootstrap-unit \
  node -e 'console.log("child-started")'
```

Expected: non-zero exit, a missing-variable error naming all five required
variables, and no `child-started`.

- [ ] **Step 7: Run enabled injection and safe-log checks**

Run with all bootstrap variables and a child command that asserts instead of
printing the injected secret:

```bash
docker run --rm \
  -e INFISICAL_US_BOOTSTRAP_ENABLED=true \
  -e INFISICAL_US_CLIENT_ID=client-id \
  -e INFISICAL_US_CLIENT_SECRET_ENC=client-secret \
  -e INFISICAL_US_ENV=prod \
  -e INFISICAL_US_PROJECT_ID=project-id \
  -e INFISICAL_US_SECRET_PATH=/tianji \
  -e DATABASE_URL=container \
  -v /tmp/tianji-infisical-sdk-fake:/opt/infisical-bootstrap/node_modules/@infisical/sdk:ro \
  tianji:infisical-bootstrap-unit \
  node -e 'const leaked = Object.keys(process.env).some((key) => key.startsWith("INFISICAL_US_")); if (process.env.DATABASE_URL !== "from-infisical" || leaked) process.exit(21); console.log("child-ok")'
```

Expected: exit `0`; logs contain `bootstrap enabled`, `authentication
succeeded`, `loaded 1 secret`, `starting Tianji`, and `child-ok`; logs do not
contain `DATABASE_URL`, `from-infisical`, or `client-secret`.

Run:

```bash
docker run --rm \
  -v /tmp/tianji-infisical-sdk-fake:/opt/infisical-bootstrap/node_modules/@infisical/sdk:ro \
  tianji:infisical-bootstrap-unit \
  node -e 'process.exit(23)'
```

Expected: wrapper exits `23`.

Run a long-lived child and signal the wrapper container:

```bash
docker run --rm --name tianji-infisical-signal-test \
  -v /tmp/tianji-infisical-sdk-fake:/opt/infisical-bootstrap/node_modules/@infisical/sdk:ro \
  tianji:infisical-bootstrap-unit \
  node -e 'setInterval(() => {}, 1000)' &
container_wait_pid=$!
until docker inspect tianji-infisical-signal-test >/dev/null 2>&1; do
  sleep 0.1
done
docker kill --signal=TERM tianji-infisical-signal-test
set +e
wait "$container_wait_pid"
container_status=$?
set -e
test "$container_status" -eq 143
```

Expected: the wrapper forwards `SIGTERM`, and Docker reports exit status `143`.

- [ ] **Step 8: Copy the bootstrap runtime and wrap the existing Docker command**

In the final `app` stage, add:

```dockerfile
COPY --from=infisical-bootstrap /opt/infisical-bootstrap /opt/infisical-bootstrap
```

Keep the existing inner shell command byte-for-byte and change only the outer
invocation:

```dockerfile
CMD ["node", "/opt/infisical-bootstrap/run.mjs", "sh", "-c", "(cd /app/tianji/src/server && ./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/tsx ./clickhouse/scripts/apply.ts && NODE_ENV=production node ./dist/src/server/main.js) & sleep 10; /usr/local/bin/tianji-reporter --url \"http://localhost:12345\" --workspace \"clnzoxcy10001vy2ohi4obbi0\" --name \"tianji-container\" --silent > /dev/null & wait -n"]
```

- [ ] **Step 9: Verify Dockerfile and final image build**

Run:

```bash
git diff --check
docker build --target app -t tianji:infisical-bootstrap-test .
docker run --rm --entrypoint node tianji:infisical-bootstrap-test \
  /opt/infisical-bootstrap/run.mjs \
  node -e "process.exit(process.env.INFISICAL_US_BOOTSTRAP_ENABLED ? 1 : 0)"
```

Expected: each command exits `0`. The final smoke test proves the built image
uses the disabled pass-through path without an Infisical request.

- [ ] **Step 10: Review the exact branch diff**

Run:

```bash
git status --short
git diff -- Dockerfile
git log -2 --oneline
```

Expected: the implementation diff contains only `Dockerfile`; the already
committed design and plan documents remain separate history entries.

- [ ] **Step 11: Commit the implementation**

```bash
git add Dockerfile
git commit -m "feat(docker): bootstrap secrets from infisical"
```
