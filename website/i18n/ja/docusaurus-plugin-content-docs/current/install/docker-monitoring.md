---
sidebar_position: 20
_i18n_hash: e85199043ed7e89d1e71ea95a75b08df
---
# Dockerコンテナモニタリング設定

## デフォルトのモニタリング動作

DockerまたはDocker Composeを使用してTianjiをインストールすると、システムは自動的に組み込みのサーバーモニタリング機能を有効にします。デフォルトでは:

- **Tianjiは自分自身のコンテナの** システムリソース使用量を自動的に監視します
- モニタリングデータには、CPU使用率、メモリ使用率、ディスク使用率、ネットワークトラフィックなどが含まれます
- このデータは追加の設定なしでデフォルトのワークスペースに自動的に報告されます
- モニタリングダッシュボードには、コンテナは`tianji-container`として表示されます

## ホストマシン上のすべてのDockerサービスのモニタリング

ホストマシン上で実行されているすべてのDockerコンテナとサービスをTianjiでモニタリングしたい場合、Tianji自身だけでなく、Dockerソケットをコンテナにマッピングする必要があります。

### 設定方法

以下のボリューム設定を`docker-compose.yml`ファイルの`tianji`サービスセクションに追加します:

```yaml
services:
  tianji:
    image: moonrailgun/tianji
    # ... 他の設定 ...
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # ... 他の設定 ...
```

### 完全なdocker-compose.yml例

```yaml
version: '3'
services:
  tianji:
    image: moonrailgun/tianji
    build:
      context: ./
      dockerfile: ./Dockerfile
    ports:
      - "12345:12345"
    environment:
      DATABASE_URL: postgresql://tianji:tianji@postgres:5432/tianji
      JWT_SECRET: replace-me-with-a-random-string
      ALLOW_REGISTER: "false"
      ALLOW_OPENAPI: "true"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # この行を追加
    depends_on:
      - postgres
    restart: always
  postgres:
    # ... postgres設定 ...
```

### Docker Runコマンドの使用

`docker run`コマンドを使用してTianjiを起動する場合、以下のパラメータを追加できます:

```bash
docker run -d \
  --name tianji \
  -p 12345:12345 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  moonrailgun/tianji
```

## 設定後の効果

Dockerソケットのマッピングを追加すると、Tianjiは次のことができるようになります:

- ホストマシン上で実行されているすべてのDockerコンテナを監視
- コンテナのリソース使用情報の取得
- コンテナステータス情報の表示
- より包括的なシステムモニタリングビューの提供
