---
sidebar_position: 1
_i18n_hash: b3805dea583e9b96a5bf32e57ff9c130
---
# Script personnalisé

Comparé aux services de surveillance traditionnels, **Tianji** prend en charge les scripts personnalisés pour soutenir des scénarios plus personnalisés.

Essentiellement, vous pouvez le comprendre comme un environnement d'exécution JavaScript restreint et sécurisé en mémoire qui accepte un nombre à afficher sur votre graphique. Le scénario le plus courant est le temps nécessaire pour les requêtes réseau pour accéder à une URL. Bien sûr, il peut également s'agir d'autres choses, comme votre solde OpenAI, votre nombre d'étoiles GitHub, et toutes les informations qui peuvent être exprimées en nombres.

Si ce script renvoie -1, cela signifie que le travail a échoué et qu'une notification vous sera envoyée, tout comme une surveillance normale.

Si vous souhaitez voir la tendance des changements d'un nombre, l'activation du mode de tendance peut vous aider à mieux détecter les changements subtils dans le nombre.

Voici quelques exemples :

## Exemples

### Obtenir le nombre de services disponibles Tailchat à partir du point de terminaison de santé

```js
const res = await request({
  url: 'https://<tailchat-server-api>/health'
})

if(!res || !res.data || !res.data.services) {
  return -1
}

return res.data.services.length
```

### Obtenir le nombre d'étoiles GitHub

```js
const res = await request({
  url: 'https://api.github.com/repos/msgbyte/tianji'
})

return res.data.stargazers_count ?? -1
```

Remplacez `msgbyte/tianji` par le nom de votre propre dépôt.

### Obtenir le nombre de pulls Docker

```js
const res = await request({
  url: "https://hub.docker.com/v2/repositories/moonrailgun/tianji/"
});

return res.data.pull_count;
```

Remplacez `moonrailgun/tianji` par le nom de votre propre image.

### Exemple pour correspondre à du texte

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

Renvoie `-1` signifie qu'il y a un problème. Dans ce cas, cela signifie que le corps HTML contient le texte `maintain`.

### Ou plus

Très très bienvenu de soumettre votre script sur cette page. Tianji est propulsé par la communauté open source.
