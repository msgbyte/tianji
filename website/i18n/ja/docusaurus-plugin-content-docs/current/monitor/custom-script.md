---
sidebar_position: 1
_i18n_hash: b3805dea583e9b96a5bf32e57ff9c130
---
# カスタムスクリプト

従来の監視サービスと比較して、**Tianji** はカスタムスクリプトをサポートし、より多くのカスタマイズされたシナリオをサポートします。

本質的に、それは制限されたメモリセーフなJavaScriptランタイムとして理解できます。これは、チャートに表示する数値を受け入れます。最も一般的なシナリオは、URLにアクセスするためのネットワークリクエストに必要な時間です。もちろん、OpenAIの残高やGitHubのスター数など、数値で表現できる他のものもあります。

このスクリプトが-1を返す場合、それはこの作業が失敗したことを意味し、通常の監視と同様に通知を送信しようとします。

数値の変化の傾向を見たい場合、トレンドモードを開くことで、数値の微妙な変化をよりよく発見できます。

以下にいくつかの例を示します：

## 例

### Tailchatの利用可能なサービス数をヘルスエンドポイントから取得

```js
const res = await request({
  url: 'https://<tailchat-server-api>/health'
})

if(!res || !res.data || !res.data.services) {
  return -1
}

return res.data.services.length
```

### GitHubのスター数を取得

```js
const res = await request({
  url: 'https://api.github.com/repos/msgbyte/tianji'
})

return res.data.stargazers_count ?? -1
```

`msgbyte/tianji` を自分のリポジトリ名に置き換えてください。

### Dockerのプル数を取得

```js
const res = await request({
  url: "https://hub.docker.com/v2/repositories/moonrailgun/tianji/"
});

return res.data.pull_count;
```

`moonrailgun/tianji` を自分のイメージ名に置き換えてください。

### テキストマッチの例

```js
const start = Date.now();
const res = await request({
  url: "https://example.com/"
});

const usage = Date.now() - start;

const matched = /maintain/.test(String(res.data));

if(matched) {
  return -1;
}

return usage;
```

`-1` を返すことは何かが間違っていることを意味します。この場合、HTML本文に `maintain` というテキストが含まれていることを意味します。

### またはそれ以上

このページにスクリプトを提出することを非常に歓迎します。Tianjiはオープンソースコミュニティによって推進されています。
