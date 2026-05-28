---
sidebar_position: 2
---

# Installation

The skill is just three files. Any modern AI agent (Cursor, Claude Code, Codex, Copilot CLI...) already knows where its own skills directory is — so installation can be as simple as pasting one prompt.

## One-Click Installation (via AI Agent)

Paste the prompt below into your AI agent. It will download the files into the correct skills directory for its platform, then ask you for any missing configuration.

```
Please install the Tianji Data Query Skill into your skills directory:

https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query

After downloading, check whether these environment variables are set:
  - TIANJI_BASE_URL
  - TIANJI_API_KEY
  - TIANJI_WORKSPACE_ID

If any are missing, ask me for the values.
```

That's it. The agent picks its own skills directory, fetches the files, and prompts you for credentials when needed.

## Manual Installation

If you'd rather install it by hand, pick the target directory for your agent and run:

```bash
DEST="$HOME/.cursor/skills/tianji-data-query"   # or whatever your agent uses
mkdir -p "$DEST/references"

BASE="https://raw.githubusercontent.com/msgbyte/tianji/master/skills/tianji-data-query"
curl -fSL "$BASE/SKILL.md"                          -o "$DEST/SKILL.md"
curl -fSL "$BASE/references/api-endpoints.md"       -o "$DEST/references/api-endpoints.md"
curl -fSL "$BASE/references/openapi-readonly.json"  -o "$DEST/references/openapi-readonly.json"
```

### Skills directory by agent

| Agent | Directory |
|-------|-----------|
| Cursor (personal) | `~/.cursor/skills/tianji-data-query/` |
| Cursor (project)  | `<project-root>/.cursor/skills/tianji-data-query/` |
| Claude Code       | `~/.claude/skills/tianji-data-query/` |
| Codex             | `~/.codex/skills/tianji-data-query/` |
| Codex (alt)       | `~/.agents/skills/tianji-data-query/` |

## Required Environment Variables

The skill expects three values. Export them in your shell rc, or set them in your agent's skill config:

```bash
# Tianji instance base URL
TIANJI_BASE_URL=https://tianji.example.com

# API key for authentication
TIANJI_API_KEY=your_api_key_here

# Default workspace ID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### Getting an API Key

1. Log in to your Tianji instance and click your **profile picture** in the top right corner.
2. Select **Profile** from the dropdown menu.
3. Find the **API Keys** section.
4. Click **Create new key** and follow the prompts.

## Next Steps

After installation, head back to [Integration with Agent Skill](./skill.md) to see usage examples, the comparison with the MCP Server, and how the skill handles sensitive data.
