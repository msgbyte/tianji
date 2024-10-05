---
sidebar_position: 1
_i18n_hash: b3805dea583e9b96a5bf32e57ff9c130
---
# Benutzerdefiniertes Skript

Im Vergleich zu traditionellen Überwachungsdiensten unterstützt **Tianji** benutzerdefinierte Skripte, um mehr angepasste Szenarien zu ermöglichen.

Im Wesentlichen können Sie es sich als eine eingeschränkte, speichersichere JavaScript-Laufzeit vorstellen, die eine Zahl akzeptiert, um auf Ihrem Diagramm anzuzeigen. Das häufigste Szenario ist die Zeit, die für Netzwerkanfragen benötigt wird, um auf eine URL zuzugreifen. Natürlich kann es auch andere Dinge sein, wie Ihr OpenAI-Guthaben, Ihre GitHub-Sterne und alle Informationen, die in Zahlen ausgedrückt werden können.

Wenn dieses Skript -1 zurückgibt, bedeutet dies, dass diese Arbeit fehlgeschlagen ist, und versucht, eine Benachrichtigung an Sie zu senden, genau wie bei normaler Überwachung.

Wenn Sie die Trends der Änderungen einer Zahl anzeigen möchten, kann das Öffnen des Trendmodus Ihnen helfen, subtile Änderungen in der Zahl besser zu entdecken.

Hier sind einige Beispiele:

## Beispiele

### Anzahl der verfügbaren Tailchat-Dienste vom Health-Endpunkt abrufen

```js
const res = await request({
  url: 'https://<tailchat-server-api>/health'
})

if(!res || !res.data || !res.data.services) {
  return -1
}

return res.data.services.length
```

### GitHub-Sterne zählen

```js
const res = await request({
  url: 'https://api.github.com/repos/msgbyte/tianji'
})

return res.data.stargazers_count ?? -1
```

Ersetzen Sie `msgbyte/tianji` durch den Namen Ihres eigenen Repositories.

### Docker-Pull-Zähler

```js
const res = await request({
  url: "https://hub.docker.com/v2/repositories/moonrailgun/tianji/"
});

return res.data.pull_count;
```

Ersetzen Sie `moonrailgun/tianji` durch den Namen Ihres eigenen Images.

### Beispiel für Textvergleich

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

Die Rückgabe von `-1` bedeutet, dass etwas schiefgelaufen ist. In diesem Fall bedeutet dies, dass der HTML-Body den Text `maintain` enthält.

### oder mehr

Es ist sehr willkommen, Ihr Skript auf dieser Seite einzureichen. Tianji wird von der Open-Source-Community angetrieben.
