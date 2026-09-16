import { spawn } from 'node:child_process';
import { createDecipheriv } from 'node:crypto';
import { InfisicalSDK } from '@infisical/sdk';
import { constants as osConstants } from 'node:os';

const prefix = '[infisical-bootstrap]';
const defaultSiteUrl = 'https://app.infisical.com';
const requestTimeoutMs = 15_000;
const secretKey = Buffer.from([
  0x72, 0x36, 0x6f, 0x05, 0xb6, 0x6e, 0xa7, 0xa6, 0x82, 0x7b, 0xd1, 0x1d,
  0x80, 0x4e, 0x17, 0xec, 0xf9, 0x94, 0xa6, 0x90, 0xa6, 0x7a, 0xba, 0x13,
  0x1a, 0x7a, 0xa7, 0xf5, 0xd0, 0x00, 0x89, 0x8e,
]);
const secretVersion = 0x01;
const secretIvLength = 12;
const secretTagLength = 16;
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

function openSecret(encoded) {
  const data = Buffer.from(encoded, 'base64');
  if (data.length < 1 + secretIvLength + secretTagLength + 1) {
    throw new Error('ciphertext too short');
  }
  if (data[0] !== secretVersion) {
    throw new Error('unsupported ciphertext version');
  }

  const iv = data.subarray(1, 1 + secretIvLength);
  const tag = data.subarray(
    1 + secretIvLength,
    1 + secretIvLength + secretTagLength
  );
  const ciphertext = data.subarray(1 + secretIvLength + secretTagLength);
  const decipher = createDecipheriv('aes-256-gcm', secretKey, iv);
  decipher.setAuthTag(tag);

  try {
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error('ciphertext authentication failed');
  }
}

async function withTimeout(promise) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('Infisical request timed out')),
      requestTimeoutMs
    );
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

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

  let clientSecret;
  try {
    clientSecret = openSecret(process.env.INFISICAL_US_CLIENT_SECRET_ENC);
  } catch {
    console.error(`${prefix} client secret decryption failed`);
    process.exit(1);
  }

  let client;
  try {
    client = new InfisicalSDK({
      siteUrl: process.env.INFISICAL_SITE_URL?.trim() || defaultSiteUrl,
    });
    await withTimeout(
      client.auth().universalAuth.login({
        clientId: process.env.INFISICAL_US_CLIENT_ID,
        clientSecret,
      })
    );
  } catch {
    console.error(`${prefix} authentication failed`);
    process.exit(1);
  }
  console.log(`${prefix} authentication succeeded`);

  let response;
  try {
    response = await withTimeout(
      client.secrets().listSecrets({
        environment: process.env.INFISICAL_US_ENV,
        projectId: process.env.INFISICAL_US_PROJECT_ID,
        secretPath: process.env.INFISICAL_US_SECRET_PATH,
        expandSecretReferences: true,
        recursive: false,
        includeImports: false,
        viewSecretValue: true,
      })
    );
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
