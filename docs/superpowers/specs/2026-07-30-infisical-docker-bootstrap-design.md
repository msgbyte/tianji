# Infisical Docker Bootstrap Design

## Goal

Allow the Tianji Docker image to fetch application secrets from Infisical
immediately before startup. The fetched secrets exist only in the Tianji
process environment and are never written to a file.

The existing Docker startup behavior must remain unchanged when the bootstrap
feature is not enabled.

## Bootstrap configuration

The Docker container accepts these bootstrap environment variables:

- `INFISICAL_US_BOOTSTRAP_ENABLED`
- `INFISICAL_US_CLIENT_ID`
- `INFISICAL_US_CLIENT_SECRET_ENC`
- `INFISICAL_US_ENV`
- `INFISICAL_US_PROJECT_ID`
- `INFISICAL_US_SECRET_PATH`
- `INFISICAL_SITE_URL` (optional, defaults to Infisical Cloud)

`INFISICAL_US_CLIENT_SECRET_ENC` uses the Flow-compatible, Base64-encoded
AES-256-GCM wire format: one version byte, a 12-byte IV, a 16-byte
authentication tag, and the ciphertext. The wrapper decrypts it in memory and
passes only the plaintext result to Infisical Universal Auth.

Bootstrap is enabled only when `INFISICAL_US_BOOTSTRAP_ENABLED` has a supported
truthy value. If it is absent or disabled, the wrapper starts Tianji with the
container environment and performs no Infisical network requests.

## Image architecture

The bootstrap wrapper is maintained as
`scripts/docker/infisical-bootstrap.mjs`. During the image build, `Dockerfile`
installs a pinned version of the official `@infisical/sdk` package in an
isolated directory outside the Tianji workspace and copies the wrapper into
that directory. The repository package manifests and Tianji application source
remain unchanged.

The Docker command invokes the wrapper around the existing Tianji server
startup command. The reporter process keeps its existing startup behavior.

## Enabled startup flow

When bootstrap is enabled, the wrapper:

1. Validates all required bootstrap variables and fails with the names of any
   missing variables.
2. Decrypts the Universal Auth client secret in memory.
3. Authenticates to the configured Infisical site with Universal Auth.
4. Lists secrets from the configured project, environment, and exact secret
   path.
5. Expands secret references but does not recursively read child paths.
6. Builds a child environment from the container environment plus the fetched
   secrets. Fetched values override existing variables with the same names.
7. Removes all `INFISICAL_US_*` bootstrap variables from the child environment.
8. Starts the original Tianji migration and server command with inherited
   standard input, output, and error streams.
9. Forwards termination signals and exits with the Tianji command's status.

No `.env` or other secret file is created.
Authentication and secret-listing operations each have a 15-second timeout.

## Logging and failures

The wrapper writes stage logs with an `infisical-bootstrap` prefix:

- bootstrap enabled
- authentication succeeded
- number of secrets loaded
- Tianji startup beginning

Logs never include secret keys, secret values, the client credentials, project
ID, environment, or secret path.

Missing configuration, authentication failure, secret loading failure, or an
invalid SDK response stops startup with a non-zero exit code. Tianji is not
started with a partial secret set.

## Verification

Automated checks cover:

- disabled bootstrap passes through without calling Infisical;
- missing enabled configuration fails before application startup;
- fetched secrets override matching container variables;
- bootstrap variables are absent from the application environment;
- Flow-compatible encrypted client secrets are decrypted before authentication;
- custom and default Infisical site URLs are passed to the SDK;
- authentication and secret loading time out after 15 seconds;
- no secret names or values appear in logs;
- child exit status and termination signals are propagated.

The Docker image is then built to verify the Dockerfile syntax and isolated SDK
installation.
