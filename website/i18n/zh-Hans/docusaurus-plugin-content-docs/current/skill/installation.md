---
sidebar_position: 2
_i18n_hash: 4ad4885ffd9d3dee0d40df9443ddf820
---
# 安装

这个技能只包含三个文件。任何现代的 AI 代理（Cursor、Claude Code、Codex、Copilot CLI 等）都已经知道其技能目录的位置，所以安装可以简单到只需粘贴一个提示。

## 一键安装（通过 AI 代理）

将以下提示粘贴到你的 AI 代理中。它会将文件下载到其平台的正确技能目录中，然后询问你任何缺失的配置。

```
请将天机数据查询技能安装到你的技能目录中：

https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query

下载后，检查以下环境变量是否设置：
  - TIANJI_BASE_URL
  - TIANJI_API_KEY
  - TIANJI_WORKSPACE_ID

如果缺少任何变量，请询问我这些值。
```

就是这样。代理会选择自己的技能目录，获取文件，并在需要时提示你提供凭证。

## 手动安装

如果你更愿意手动安装，请选择你的代理的目标目录并运行以下命令：

```bash
DEST="$HOME/.cursor/skills/tianji-data-query"   # 或你的代理使用的目录
mkdir -p "$DEST/references"

BASE="https://raw.githubusercontent.com/msgbyte/tianji/master/skills/tianji-data-query"
curl -fSL "$BASE/SKILL.md"                          -o "$DEST/SKILL.md"
curl -fSL "$BASE/references/api-endpoints.md"       -o "$DEST/references/api-endpoints.md"
curl -fSL "$BASE/references/openapi-readonly.json"  -o "$DEST/references/openapi-readonly.json"
```

### 不同代理的技能目录

| 代理 | 目录 |
|-------|-----------|
| Cursor（个人） | `~/.cursor/skills/tianji-data-query/` |
| Cursor（项目） | `<project-root>/.cursor/skills/tianji-data-query/` |
| Claude Code | `~/.claude/skills/tianji-data-query/` |
| Codex | `~/.codex/skills/tianji-data-query/` |
| Codex（备用） | `~/.agents/skills/tianji-data-query/` |

## 所需环境变量

技能需要三个值。在你的 shell rc 文件中导出它们，或者在你的代理的技能配置中设置它们：

```bash
# 天机实例的基础 URL
TIANJI_BASE_URL=https://tianji.example.com

# 用于身份验证的 API 密钥
TIANJI_API_KEY=your_api_key_here

# 默认工作区 ID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### 获取 API 密钥

1. 登录你的天机实例并点击右上角的**个人头像**。
2. 从下拉菜单中选择**个人资料**。
3. 找到**API 密钥**部分。
4. 点击**创建新密钥**并按照提示操作。

## 下一步

安装完成后，返回[与代理技能的集成](./skill.md)以查看使用示例，与 MCP 服务器的对比，以及该技能如何处理敏感数据。
