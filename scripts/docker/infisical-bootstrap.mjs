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
