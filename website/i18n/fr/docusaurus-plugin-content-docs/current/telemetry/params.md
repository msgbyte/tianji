---
sidebar_position: 2
_i18n_hash: ca2b25a29f0f1a82407be367a1d03553
---
# Paramètres

Voici un exemple d'utilisation et de configuration avec l'image de télémétrie.

Tout est optionnel. Cela améliorera votre utilisation dans différents contextes.

| nom | description |
| -------- | --------- |
| url | Par défaut, l'URL de référence générée automatiquement par le navigateur sera utilisée, mais certains sites web n'autorisent pas ce type de header. Vous devez donc le fournir vous-même. Si Tianji ne peut obtenir l'URL nulle part, le système l'ignorera et ne consignera pas cette visite. |
| name | Définit le nom de l'événement de télémétrie, ce qui permet de distinguer différents événements dans le même enregistrement de télémétrie. |
| title | **[BADGE UNIQUEMENT]**, définit le titre du badge |
| start | **[BADGE UNIQUEMENT]**, définit le nombre de départ du badge |
| fullNum | **[BADGE UNIQUEMENT]**, définit si le badge affichera le nombre complet, par défaut, il utilise des chiffres abrégés (par exemple : `12345` et `12.3k`) |

## Comment utiliser

Il est facile de transmettre des paramètres dans l'URL.

Par exemple :

```
https://tianji.example.com/telemetry/<workspaceId>/<telemetryId>/badge.svg?name=myEvent&url=https://google.com&title=My+Counter&start=100000&fullNum=true
```

Si vous n'êtes pas familier avec cela, vous pouvez consulter la page wiki à ce sujet : [https://en.wikipedia.org/wiki/Query_string](https://en.wikipedia.org/wiki/Query_string)
