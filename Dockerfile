# syntax=docker/dockerfile:1

# tianji reporter
FROM golang:1.25.11-bookworm AS reporter
ENV PATH="/usr/local/go/bin:${PATH}"
WORKDIR /app

COPY ./reporter/ ./reporter/

RUN apt update
RUN cd reporter && CGO_ENABLED=0 GOOS=linux go build -a -ldflags '-extldflags "-static"' -o tianji-reporter .

# Infisical bootstrap ------------------------------
FROM node:22.22-alpine3.23 AS infisical-bootstrap
WORKDIR /opt/infisical-bootstrap

RUN npm install \
      --omit=dev \
      --ignore-scripts \
      --no-audit \
      --no-fund \
      @infisical/sdk@5.0.2

COPY <<'EOF' /opt/infisical-bootstrap/run.mjs
import { spawn } from 'node:child_process';
import { InfisicalSDK } from '@infisical/sdk';
import { constants as osConstants } from 'node:os';

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

  let client;
  try {
    client = new InfisicalSDK();
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
        try {
          child.kill(signal);
        } catch {
          // The child may have exited between the signal and this handler.
        }
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
    process.exit(128 + (osConstants.signals[signal] ?? 0));
  }

  process.exit(code ?? 1);
});
EOF

# Base ------------------------------
# Pin below Alpine 3.24 until Docker Hub static scans handle it reliably.
FROM node:22.22-alpine3.23 AS base

RUN npm install -g pnpm@10.27.0

# For apprise and Prisma
RUN apk add --update --no-cache python3 py3-pip g++ make openssl

# For puppeteer
RUN apk upgrade --no-cache --available glib \
    && apk add --no-cache \
      chromium-swiftshader \
      ttf-freefont \
      font-noto-emoji \
    && apk add --no-cache \
      --repository=https://dl-cdn.alpinelinux.org/alpine/edge/community \
      font-wqy-zenhei

# For zeromq
RUN apk add --update --no-cache curl cmake

# Tianji frontend ------------------------------
FROM base AS static
WORKDIR /app/tianji

# use with --build-arg VERSION=xxxx
ARG VERSION

COPY . .

RUN pnpm install --filter @tianji/client... --config.dedupe-peer-dependents=false --frozen-lockfile

ENV VITE_VERSION=$VERSION
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN pnpm build:static

# Tianji server ------------------------------
FROM base AS app
WORKDIR /app/tianji

COPY --from=infisical-bootstrap /opt/infisical-bootstrap /opt/infisical-bootstrap

# We don't need the standalone Chromium in alpine.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY . .

RUN pnpm install --filter @tianji/server... --config.dedupe-peer-dependents=false

RUN mkdir -p ./src/server/public
COPY --from=static /app/tianji/geo /app/tianji/geo
COPY --from=static /app/tianji/src/server/public /app/tianji/src/server/public

# Copy reporter binary from reporter stage
COPY --from=reporter /app/reporter/tianji-reporter /usr/local/bin/tianji-reporter
RUN chmod +x /usr/local/bin/tianji-reporter

RUN pnpm build:server

RUN CI=true pnpm prune --prod --config.dedupe-peer-dependents=false
RUN CI=true pnpm install --filter @tianji/server... --prod --offline --ignore-scripts --config.dedupe-peer-dependents=false

RUN pip install apprise cryptography --break-system-packages
RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/lib/node_modules/pnpm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/bin/pnpm \
    /usr/local/bin/pnpx

RUN rm -rf ./src/client
RUN rm -rf ./website
RUN rm -rf ./reporter

EXPOSE 12345

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:12345/health || exit 1

CMD ["node", "/opt/infisical-bootstrap/run.mjs", "sh", "-c", "(cd /app/tianji/src/server && ./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/tsx ./clickhouse/scripts/apply.ts && NODE_ENV=production node ./dist/src/server/main.js) & sleep 10; /usr/local/bin/tianji-reporter --url \"http://localhost:12345\" --workspace \"clnzoxcy10001vy2ohi4obbi0\" --name \"tianji-container\" --silent > /dev/null & wait -n"]
