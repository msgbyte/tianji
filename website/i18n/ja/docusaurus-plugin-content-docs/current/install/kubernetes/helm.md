---
sidebar_position: 1
_i18n_hash: c95e9693eac4df676574d4eb8357881d
---
# Helmでのインストール

Helmは、Kubernetesアプリケーションのインストールと管理を合理化するツールです。Helmを使用すると、Kubernetesでtianjiを簡単かつ迅速に利用できます。

## リポジトリの追加

まず、msgbyteのチャートレジストリをHelmのリポジトリリストに追加する必要があります。

```bash
helm repo add msgbyte https://msgbyte.github.io/charts
```

これで、`helm search`コマンドでtianjiを検索できます。

```bash
helm search repo tianji
```

## インストール

その後、以下のコマンドで簡単にインストールできます：

```bash
helm install tianji msgbyte/tianji
```

これにより、PostgreSQLデータベースとtianjiが提供されます。
