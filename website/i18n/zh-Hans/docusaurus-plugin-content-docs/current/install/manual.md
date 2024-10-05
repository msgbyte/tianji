---
sidebar_position: 1
_i18n_hash: 7b72ca055d015393e7ca37eb45f7a74b
---
# 无 Docker 安装

使用 Docker 安装 `Tianji` 是最好的方式，你不需要考虑环境问题。

但如果你所在的服务器不支持 Docker，你可以尝试手动安装。

## 要求

你需要：

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 9.x（9.7.1 更好）
- [Git](https://git-scm.com/downloads)
- [postgresql](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - 用于在后台运行 Tianji
- [apprise](https://github.com/caronc/apprise) - 可选，如果你需要通知功能

## 克隆代码并构建

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## 准备环境文件

在 `src/server` 目录下创建一个 `.env` 文件

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="replace-me-with-a-random-string"
```

确保你的数据库 URL 是正确的，并且在之前创建了数据库。

更多环境变量可以查看此文档 [environment](../environment.md)

> 如果可以，最好确保你的编码是 en_US.utf8，例如：`createdb -E UTF8 -l en_US.utf8 tianji`

## 运行服务器

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# 初始化数据库迁移
cd src/server
pnpm db:migrate:apply

# 启动服务器
pm2 start ./dist/src/server/main.js --name tianji
```

默认情况下，`Tianji` 将在 `http://localhost:12345` 上运行

## 更新代码到新版本

```bash
# 检出新的发布/标签
cd tianji
git fetch --tags
git checkout -q <version>

# 更新依赖
pnpm install

# 构建项目
pnpm build

# 运行数据库迁移
cd src/server
pnpm db:migrate:apply

# 重启服务器
pm2 restart tianji
```

# 常见问题

## 安装 `isolated-vm` 失败

如果你使用的是 python 3.12，它会报告如下错误：

```
ModuleNotFoundError: No module named 'distutils'
```

这是因为 python 3.12 从内置模块中移除了 `distutils`。现在我们有一个好的解决方案。

你可以将你的 python 版本从 3.12 切换到 3.9 来解决这个问题。

### 如何在 brew 控制的 python 中解决这个问题

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

然后你可以使用 `python3 --version` 检查版本
