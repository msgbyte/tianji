---
sidebar_position: 2
_i18n_hash: 4ad4885ffd9d3dee0d40df9443ddf820
---
# インストール

このスキルは3つのファイルだけで構成されています。現代のAIエージェント（Cursor、Claude Code、Codex、Copilot CLIなど）はすでに自分のスキルディレクトリを知っているため、インストールは1つのプロンプトを貼り付けるだけで簡単です。

## ワンクリックインストール（AIエージェント経由）

以下のプロンプトをAIエージェントに貼り付けてください。それにより、プラットフォームに適したスキルディレクトリにファイルをダウンロードし、必要な設定情報を尋ねます。

```
あなたのスキルディレクトリにTianji Data Query Skillをインストールしてください：

https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query

ダウンロード後、以下の環境変数が設定されているか確認してください：
  - TIANJI_BASE_URL
  - TIANJI_API_KEY
  - TIANJI_WORKSPACE_ID

もし不足があれば、値を尋ねてください。
```

以上です。エージェントがスキルディレクトリを選び、ファイルを取得し、必要な場合に資格情報を尋ねます。

## 手動インストール

手作業でインストールしたい場合、エージェントのターゲットディレクトリを選んで以下を実行してください：

```bash
DEST="$HOME/.cursor/skills/tianji-data-query"   # またはエージェントが使用するディレクトリ
mkdir -p "$DEST/references"

BASE="https://raw.githubusercontent.com/msgbyte/tianji/master/skills/tianji-data-query"
curl -fSL "$BASE/SKILL.md"                          -o "$DEST/SKILL.md"
curl -fSL "$BASE/references/api-endpoints.md"       -o "$DEST/references/api-endpoints.md"
curl -fSL "$BASE/references/openapi-readonly.json"  -o "$DEST/references/openapi-readonly.json"
```

### エージェント別のスキルディレクトリ

| エージェント | ディレクトリ |
|-------------|--------------|
| Cursor（個人用） | `~/.cursor/skills/tianji-data-query/` |
| Cursor（プロジェクト用）  | `<project-root>/.cursor/skills/tianji-data-query/` |
| Claude Code       | `~/.claude/skills/tianji-data-query/` |
| Codex             | `~/.codex/skills/tianji-data-query/` |
| Codex（代替）   | `~/.agents/skills/tianji-data-query/` |

## 必須の環境変数

スキルは3つの値を必要とします。shell rcにエクスポートするか、エージェントのスキル設定で設定してください：

```bash
# TianjiインスタンスのベースURL
TIANJI_BASE_URL=https://tianji.example.com

# 認証用APIキー
TIANJI_API_KEY=your_api_key_here

# デフォルトワークスペースID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### APIキーの取得

1. Tianjiインスタンスにログインし、右上の**プロフィール画像**をクリックします。
2. ドロップダウンメニューから**プロフィール**を選択します。
3. **APIキー**セクションを見つけます。
4. **新しいキーを作成**をクリックし、指示に従います。

## 次のステップ

インストール後は、[エージェントスキルとの統合](./skill.md)に戻り、使用例、MCPサーバとの比較、およびスキルが機密データをどのように処理するかを確認してください。
