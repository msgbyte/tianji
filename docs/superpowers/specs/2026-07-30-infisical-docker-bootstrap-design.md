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

For the first version, `INFISICAL_US_CLIENT_SECRET_ENC` is passed directly to
Infisical Universal Auth as the client secret. No decoding or decryption is
performed.

Bootstrap is enabled only when `INFISICAL_US_BOOTSTRAP_ENABLED` has a supported
truthy value. If it is absent or disabled, the wrapper starts Tianji with the
container environment and performs no Infisical network requests.

## Image architecture

Only `Dockerfile` is changed. During the image build, a pinned version of the
official `@infisical/sdk` package and a small Node.js bootstrap wrapper are
installed in an isolated directory outside the Tianji workspace. The repository
package manifests and application source remain unchanged.

The Docker command invokes the wrapper around the existing Tianji server
startup command. The reporter process keeps its existing startup behavior.

## Enabled startup flow

When bootstrap is enabled, the wrapper:

1. Validates all required bootstrap variables and fails with the names of any
   missing variables.
2. Authenticates to the default US Infisical service with Universal Auth.
3. Lists secrets from the configured project, environment, and exact secret
   path.
4. Expands secret references but does not recursively read child paths.
5. Builds a child environment from the container environment plus the fetched
   secrets. Fetched values override existing variables with the same names.
6. Removes all `INFISICAL_US_*` bootstrap variables from the child environment.
7. Starts the original Tianji migration and server command with inherited
   standard input, output, and error streams.
8. Forwards termination signals and exits with the Tianji command's status.

No `.env` or other secret file is created.

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
- no secret names or values appear in logs;
- child exit status and termination signals are propagated.

The Docker image is then built to verify the Dockerfile syntax and isolated SDK
installation.
