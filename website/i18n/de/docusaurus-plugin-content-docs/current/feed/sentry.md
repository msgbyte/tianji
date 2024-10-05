---
sidebar_position: 1
_i18n_hash: c24c34a1a9df2ee5bd25253195dcba08
---
# Integration mit Sentry

:::info
Erfahren Sie mehr über Sentry auf [sentry.io](https://sentry.io/)
:::

Klicken Sie auf `Einstellungen` => `Integrationen` => `Neue Integration erstellen`

![](/img/docs/sentry/sentry1.png)

Erstellen Sie eine `Interne Integration` Anwendung

![](/img/docs/sentry/sentry2.png)

Geben Sie den Namen `Tianji` ein und fügen Sie die Webhook-URL in das Formular ein.

![](/img/docs/sentry/sentry3.png)

Vergessen Sie nicht, `Alert Rule Action` zu aktivieren

![](/img/docs/sentry/sentry4.png)

Fügen Sie dann die Berechtigung `Issue lesen` hinzu und fügen Sie `issue` und `error` zum Webhook hinzu

![](/img/docs/sentry/sentry5.png)

Schließlich können Sie eine Alert-Regel erstellen und `Tianji` in der Dropdown-Liste der Benachrichtigungsabschnitte sehen

![](/img/docs/sentry/sentry6.png)
