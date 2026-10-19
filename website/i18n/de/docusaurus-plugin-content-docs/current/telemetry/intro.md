---
sidebar_position: 1
_i18n_hash: 1eae5f5894f7cbf4de993993feab86a5
---
# Einleitung

## Hintergrund

Als Content-Ersteller publizieren wir oft unsere Artikel auf verschiedenen Drittanbieter-Plattformen. Doch für diejenigen unter uns, die ihren Content ernst nehmen, ist die Veröffentlichung erst der Anfang. Wir müssen kontinuierlich die Leserschaft unserer Artikel im Laufe der Zeit überwachen. Leider sind unsere Datensammelfähigkeiten auf das beschränkt, was jede Plattform bietet, was stark von den eigenen Fähigkeiten der Plattform abhängt. Darüber hinaus sind die Leserschafts- und Besuchsdaten vollständig isoliert, wenn wir denselben Inhalt auf verschiedenen Plattformen verteilen.

Als Entwickler erstelle ich viele Softwareanwendungen. Sobald ich diese Anwendungen veröffentliche, verliere ich jedoch oft die Kontrolle über sie. Zum Beispiel habe ich nach der Freigabe eines Befehlszeilenprogramms keine Möglichkeit mehr zu erfahren, wie Nutzer damit interagieren oder wie viele Nutzer meine Anwendung verwenden. Ähnlich verhält es sich beim Entwickeln einer Open-Source-Anwendung: In der Vergangenheit konnte ich das Interesse nur durch GitHub-Sterne abschätzen, was mir über die tatsächliche Nutzung im Dunkeln ließ.

Daher benötigen wir eine einfache Lösung, die minimale Informationen sammelt und die persönliche Privatsphäre und andere Einschränkungen respektiert. Diese Lösung ist Telemetrie.

## Telemetrie

Im Bereich der Informatik ist Telemetrie eine gängige Technologie, die ein minimales und anonymes Informationen-Melden beinhaltet, um Datenschutzbedenken gerecht zu werden und dennoch die grundlegenden Analysebedürfnisse von Content-Erstellern zu erfüllen.

Beispielsweise sammelt das React Next.js-Framework mithilfe von Telemetrie Informationen: [API Referenz: Next.js CLI | Next.js (nextjs.org)](https://nextjs.org/docs/app/api-reference/next-cli#telemetry)

Alternativ ist es möglich, durch das Einbetten eines 1px großen, leeren, transparenten Pixelbildes in einen Artikel Besucherdaten auf Webseiten zu sammeln, über die wir keine Kontrolle haben. Moderne Browser und die meisten Websites blockieren das Einfügen benutzerdefinierter Skripte aufgrund potenzieller Sicherheitsrisiken. Ein Bild erscheint im Vergleich viel harmloser. Fast alle Websites erlauben das Laden von Drittanbieter-Bildern, was Telemetrie möglich macht.

## Welche Informationen können wir durch ein Bild sammeln?

Erstaunlicherweise ermöglicht uns der Empfang einer einzigen Bildanfrage, mehr Informationen zu sammeln, als man vermuten würde.

Durch die Analyse von Netzwerk-Anfragen können wir die IP-Adresse des Nutzers, die Besuchszeit, den Referrer und den Gerätetyp erhalten. Dies ermöglicht uns die Analyse von Verkehrsmustern, wie Spitzenlesezeiten und Trends, demografische Verteilung und Verkehrsdichte über verschiedene Plattformen hinweg. Diese Informationen sind besonders wertvoll für Marketing- und Werbeaktivitäten.

![](/img/telemetry/1.png)

## Wie können wir Telemetrie implementieren?

Telemetrie ist eine unkomplizierte Technologie, die im Wesentlichen einen Endpunkt benötigt, um Internetanfragen zu empfangen. Aufgrund ihrer Einfachheit gibt es nur wenige dedizierte Werkzeuge für diesen Zweck. Viele betrachten Analysen möglicherweise nicht als wichtig oder werden durch die anfänglichen Barrieren abgeschreckt. Der Bedarf für eine solche Funktionalität ist jedoch offensichtlich.

Die Entwicklung einer Telemetrielösung ist einfach. Sie müssen lediglich ein Projekt erstellen, eine Route einrichten, Informationen aus dem Anfrageinhalt sammeln und ein leeres Bild zurückgeben.

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

Falls Sie keine eigene Lösung entwickeln möchten, empfehle ich Tianji. Als Open-Source-Projekt, das **Website-Analysen**, **Uptime-Monitoring** und **Server-Status** bietet, hat Tianji kürzlich eine Telemetrie-Funktion eingeführt, die Content-Ersteller beim Melden von Telemetrie unterstützt und so eine bessere Datenerhebung erleichtert. Am wichtigsten ist, dass Sie als Open-Source das volle Eigentum an Ihren Daten haben und den Datenverkehr von mehreren Plattformen an einem Ort zusammenfassen können, um eine Fragmentierung beim Betrachten derselben Informationen an verschiedenen Orten zu vermeiden.

![](/img/telemetry/2.png)

GitHub: [https://github.com/msgbyte/tianji](https://github.com/msgbyte/tianji)

Offizielle Website: [https://tianji.dev/](https://tianji.dev/)
