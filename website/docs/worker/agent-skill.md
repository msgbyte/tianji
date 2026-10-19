---
sidebar_position: 3
title: Worker Agent Skill
description: Download an agent skill for creating, testing, deploying, and operating Tianji Workers.
---

# Worker Agent Skill

The **Tianji Worker Skill** teaches coding agents how to write Worker code and carry out common operations using the dashboard, CLI, and supported management APIs.

<a href="/skills/tianji-worker.tar.gz" download>Download the Tianji Worker Skill (.tar.gz)</a>

The archive contains an installable `tianji-worker` folder with `SKILL.md`, a common-operations guide, and the [Worker Agent Reference](./agent-reference.md). It includes no credentials and requires no MCP server.

## Install

Download and extract the archive into your agent's skills directory. For Codex:

```bash
curl --fail --location https://tianji.dev/skills/tianji-worker.tar.gz \
  --output tianji-worker.tar.gz
mkdir -p ~/.codex/skills
tar -xzf tianji-worker.tar.gz -C ~/.codex/skills
```

For Claude Code, use `~/.claude/skills`; for Cursor, use `~/.cursor/skills`. If you already installed this skill, review local customizations before replacing its files. Restart or reload the agent session after installation.

## What the agent learns

| Operation         | Guidance included                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Create and update | Runtime contract, payload validation, local project setup, deployment, preserving existing settings |
| Test and invoke   | Draft tests, saved-code manual runs, public HTTP requests, and their different effects              |
| Debug             | Execution history, logs, errors, and common configuration problems                                  |
| Configure         | Text/Secret variables, shared-module bindings, cron expressions, and workspace timezone             |
| Maintain          | Revision comparison and rollback, pause/resume, and deletion                                        |

Before operating on an instance, the skill instructs the agent to read that instance's `/open/_document` and confirm exported operations, paths, and request schemas. The live document takes precedence over bundled API examples. If discovery fails, the agent reports the problem instead of guessing management API requests.

The skill focuses on operational rules that a schema alone cannot supply: preserving active/cron settings, retaining Secrets during replacement updates, and understanding rollback scope. For example, CLI deployment activates a Worker and can disable its existing schedule; a draft test isolates KV but can still call real external services. When an operation is absent from OpenAPI, the agent uses supported dashboard actions or separately verified tRPC calls.

## Example requests

```text
Use tianji-worker to create a Worker that validates an incoming webhook and
forwards its message using a Secret named API_TOKEN. Give me valid and invalid
test payloads. Save the code locally for review.
```

```text
Update Worker <worker-id> in workspace <workspace-id> on <server-url>.
Keep its active state, cron schedule, and environment variables unchanged.
Test the new code before deploying it, then check the execution logs.
```

```text
Inspect the recent failures for Worker <worker-id>, compare its revisions,
and explain which revision could restore the previous behavior.
```

```text
Pause Worker <worker-id> without deleting its code or cron configuration.
```

Provide the target server and workspace through your existing configuration. Keep API keys and Secret values in secure configuration rather than pasting them into prompts. The skill supplies instructions; it does not grant access to your Tianji instance.

## Source and maintenance

The source lives in [`skills/tianji-worker`](https://github.com/msgbyte/tianji/tree/master/skills/tianji-worker). The website build refreshes the bundled runtime reference from the Worker documentation and rebuilds the download. Operations not exported to OpenAPI, including their tRPC inputs, require separate maintenance against the matching server and dashboard code; `/open/_document` does not synchronize them. CLI and runtime behavior also remain part of the maintained reference. To rebuild the download locally:

```bash
pnpm --dir website build:worker-skill
```

For a walkthrough in the dashboard, see [Worker Getting Started](./getting-started.md). For read-only queries across Tianji services, see the separate [Tianji Data Query Skill](../skill/).
