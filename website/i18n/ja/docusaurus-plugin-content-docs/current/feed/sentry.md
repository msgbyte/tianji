---
sidebar_position: 1
_i18n_hash: c24c34a1a9df2ee5bd25253195dcba08
---
# Sentryとの統合

:::info
Sentryの詳細については、[sentry.io](https://sentry.io/)をご覧ください。
:::

`設定` => `統合` => `新しい統合を作成`をクリックします。

![](/img/docs/sentry/sentry1.png)

`内部統合`アプリケーションを作成します。

![](/img/docs/sentry/sentry2.png)

名前に`Tianji`を入力し、Webhook URLをフォームに入力します。

![](/img/docs/sentry/sentry3.png)

`アラートルールアクション`を有効にするのを忘れないでください。

![](/img/docs/sentry/sentry4.png)

次に、問題読み取り`権限`を追加し、Webhookに`問題`と`エラー`を追加します。

![](/img/docs/sentry/sentry5.png)

最後に、アラートルールを作成すると、通知セクションのドロップダウンリストに`Tianji`が表示されます。

![](/img/docs/sentry/sentry6.png)
