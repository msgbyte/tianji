---
sidebar_position: 1
_i18n_hash: c61b6c9968c295ffdfdc1a484f853504
---
# Einführung

## Hintergrund

Als Content-Ersteller veröffentlichen wir unsere Artikel häufig auf verschiedenen Drittanbieter-Plattformen. Für diejenigen von uns, die ernsthaft mit ihrem Content umgehen, ist die Veröffentlichung jedoch erst der Anfang. Wir müssen die Leserzahlen unserer Artikel im Laufe der Zeit kontinuierlich überwachen. Leider sind unsere Datenerfassungsmöglichkeiten auf das beschränkt, was jede Plattform bietet, was stark von den eigenen Fähigkeiten der Plattform abhängt. Darüber hinaus sind die Leser- und Besucherdaten bei der Verteilung desselben Inhalts auf verschiedenen Plattformen völlig isoliert.

Als Entwickler erstelle ich viele Softwareanwendungen. Sobald ich diese jedoch veröffentliche, verliere ich oft die Kontrolle darüber. Zum Beispiel habe ich nach der Veröffentlichung eines Befehlszeilenprogramms keine Möglichkeit zu wissen, wie Benutzer damit interagieren oder gar wie viele Benutzer meine Anwendung nutzen. In ähnlicher Weise konnte ich bei der Entwicklung einer Open-Source-Anwendung in der Vergangenheit nur durch GitHub-Sterne das Interesse einschätzen, wobei ich im Dunkeln darüber blieb, wie sie tatsächlich genutzt wurde.

Daher benötigen wir eine einfache Lösung, die minimale Informationen sammelt und dabei persönliche Privatsphäre und andere Einschränkungen respektiert. Diese Lösung ist Telemetrie.

## Telemetrie

In der Computertechnik ist Telemetrie eine gängige Technologie, die die minimale und anonyme Meldung von Informationen beinhaltet, um Datenschutzbedenken zu berücksichtigen und gleichzeitig die grundlegenden Analysebedürfnisse von Content-Erstellern zu erfüllen.

Zum Beispiel sammelt das Next.js-Framework von React Informationen mithilfe von Telemetrie: [API-Referenz: Next.js CLI | Next.js (nextjs.org)](https://nextjs.org/docs/app/api-reference/next-cli#telemetry)

Alternativ ist es durch Einbetten eines 1px großen, leeren transparenten Pixelbilds in einen Artikel möglich, Besucherdaten auf Websites zu sammeln, über die wir keine Kontrolle haben. Moderne Browser und die meisten Websites blockieren das Einfügen benutzerdefinierter Skripte aufgrund potenzieller Sicherheitsrisiken. Ein Bild erscheint jedoch im Vergleich viel harmloser. Fast alle Websites erlauben das Laden von Bildern von Drittanbietern, wodurch Telemetrie möglich wird.

## Welche Informationen können wir über ein Bild sammeln?

Überraschenderweise ermöglicht die Erhaltung einer einzelnen Bildanfrage die Sammlung mehr Informationen, als man erwarten könnte.

Durch die Analyse von Netzwerkanfragen können wir die IP-Adresse des Benutzers, die Besuchszeit, den Referrer und den Gerätetyp erhalten. Dies ermöglicht es uns, Verkehrsmuster zu analysieren, wie z.B. Spitzenzeiten der Leserzahlen und Trends, demografische Verteilung und die Granularität des Verkehrs über verschiedene Plattformen. Diese Informationen sind besonders wertvoll für Marketing- und Promotionsaktivitäten.

![](/img/telemetry/1.png)

## Wie können wir Telemetrie implementieren?

Telemetrie ist eine unkomplizierte Technologie, die im Wesentlichen einen Endpunkt benötigt, um Internetanfragen zu empfangen. Aufgrund ihrer Einfachheit gibt es wenige dedizierte Tools für diesen Zweck. Viele betrachten möglicherweise Analysen als unwichtig oder werden durch die anfänglichen Hürden abgeschreckt. Dennoch ist der Bedarf an solchen Funktionen offensichtlich.

Die Entwicklung einer Telemetrie-Lösung ist einfach. Sie müssen lediglich ein Projekt erstellen, eine Route einrichten, Informationen aus dem Anfragekörper sammeln und ein leeres Bild zurückgeben.

Hier ist ein Beispiel mit Node.js:

```jsx
router.get(
  '/telemetry.gif',
  async (req, res) => {
    const ip = req.ip;
    const referer = req.header['referer'];
    const userAgent = req.headers['user-agent'];
    
    // Speichern Sie es in Ihrer Datenbank
    
    const blankGifBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.header('Content-Type', 'image/gif').send(blankGifBuffer);
  }
);
```

Wenn Sie keine eigene Lösung entwickeln möchten, empfehle ich Tianji. Als Open-Source-Projekt, das **Website-Analytik**, **Uptime-Überwachung** und **Server-Status** anbietet, hat Tianji kürzlich eine Telemetrie-Funktion eingeführt, um Content-Erstellern bei der Meldung von Telemetrie zu helfen und so eine bessere Datenerfassung zu ermöglichen. Vor allem bedeutet Open-Source, dass Sie die Kontrolle über Ihre Daten haben und den Verkehr von mehreren Plattformen an einem Ort aggregieren können, wodurch die Fragmentierung beim Betrachten derselben Informationen an verschiedenen Orten vermieden wird.

![](/img/telemetry/2.png)

GitHub: [https://github.com/msgbyte/tianji](https://github.com/msgbyte/tianji) 

Offizielle Website: [https://tianji.msgbyte.com/](https://tianji.msgbyte.com/)
