---
sidebar_position: 0
_i18n_hash: 2279fcf53ed0422cb00d2f89e2a43ac7
---
# Feed Übersicht

Feed ist ein leichtgewichtiges Ereignis-Stream für Ihren Arbeitsbereich. Es hilft Teams, wichtige Ereignisse aus verschiedenen Systemen in Kanäle zu aggregieren, um Vorfälle zu bearbeiten und Stakeholder informiert zu halten.

## Konzepte

- Kanal: Ein logischer Stream, um Ereignisse zu sammeln und zu organisieren. Jeder Kanal kann mit einem oder mehreren Benachrichtigungszielen verbunden werden und kann optional eine Webhook-Signatur erfordern.
- Ereignis: Ein einzelner Eintrag mit Name, Inhalt, Tags, Quelle, Absenderidentität, Wichtigkeit und optionalem Payload. Ereignisse können archiviert oder entarchiviert werden.
- Zustand: Eine spezielle Art von laufendem Ereignis, das mit einer stabilen Ereignis-ID wiederholt eingefügt oder aktualisiert werden kann und bei Abschluss gelöst wird.
- Integration: Integrierte Webhook-Adapter, die Nutzlasten von Drittanbietern (z.B. GitHub, Stripe, Sentry, Tencent Cloud Alarm) in Feed-Ereignisse umwandeln.
- Benachrichtigung: Kanäle können Ereignisse an konfigurierte Benachrichtigungen weiterleiten; die Lieferhäufigkeit kann durch die Kanaleinstellungen angepasst werden.

## Typische Anwendungsfälle

- Produkt- und Infrastruktur-Ereignisstream über mehrere Dienste hinweg
- CI/CD-Deployments und Release-Mitteilungen
- Abrechnungs- und Abonnement-Signale
- Sicherheits-, Überwachungs- und Fehlerwarnungen
