---
sidebar_position: 1
_i18n_hash: 252240b2a37c8c4784462e75b56d5243
---
# Einführung

## Was ist Tianji?

Eine kurze Zusammenfassung:

**Tianji** = **Website-Analytik** + **Uptime-Monitor** + **Serverstatus**

### Warum heißt es Tianji?

Tianji (天机, Aussprache Tiān Jī) bedeutet auf Chinesisch **himmlische Gelegenheit** oder **Strategie**.

Die Zeichen 天 (Tiān) und 机 (Jī) können jeweils mit "Himmel" und "Maschine" oder "Mechanismus" übersetzt werden. In Kombination könnte es sich auf einen strategischen oder gelegenheitsbedingten Plan oder eine Gelegenheit beziehen, die von einer höheren Macht oder einer himmlischen Kraft inszeniert scheint.

## Motivation

Bei unseren Beobachtungen von Websites müssen wir oft mehrere Anwendungen gleichzeitig verwenden. Zum Beispiel benötigen wir Analysewerkzeuge wie `GA`/`umami`, um pv/uv und die Besucherzahlen jeder Seite zu überprüfen, einen Uptime-Monitor, um die Netzwerkqualität und Verbindung des Servers zu überprüfen, und wir müssen Prometheus verwenden, um den vom Server gemeldeten Status zu erhalten, um die Qualität des Servers zu überprüfen. Darüber hinaus benötigen wir oft ein Telemetriesystem, um uns bei der Entwicklung einer Anwendung, die Open-Source-Bereitstellung ermöglicht, die einfachsten Informationen über die Bereitstellungssituationen anderer zu sammeln.

Ich denke, diese Tools sollten demselben Zweck dienen, gibt es also eine Anwendung, die diese häufigen Bedürfnisse auf leichte Weise integrieren kann? Schließlich benötigen wir die meiste Zeit nicht sehr professionelle und tiefe Funktionen. Aber um umfassende Überwachung zu erreichen, müssen ich so viele Dienste installieren.

Es ist gut, sich auf eine Sache zu spezialisieren, wenn wir Experten in verwandten Fähigkeiten sind, benötigen wir solche spezialisierten Tools. Aber für die meisten Benutzer mit leichten Anforderungen wird eine **All-in-One**-Anwendung bequemer und einfacher zu bedienen sein.

## Installation

Die Installation von Tianji mit Docker ist sehr einfach. Stellen Sie einfach sicher, dass Sie Docker und das Docker-Compose-Plugin installiert haben.

Führen Sie dann diese Befehle überall aus:

```bash
wget https://raw.githubusercontent.com/msgbyte/tianji/master/docker-compose.yml
docker compose up -d
```

> Das Standardkonto ist **admin**/**admin**, bitte ändern Sie das Passwort so schnell wie möglich.

## Community

Treten Sie unserer lebendigen Community bei, um sich mit anderen Benutzern zu verbinden, Erfahrungen auszutauschen und über die neuesten Funktionen und Entwicklungen auf dem Laufenden zu bleiben. Zusammenarbeiten, Fragen stellen und zum Wachstum der Tianji-Community beitragen.

- [GitHub](https://github.com/msgbyte/tianji)
- [Discord](https://discord.gg/8Vv47wAEej)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/tianji)
