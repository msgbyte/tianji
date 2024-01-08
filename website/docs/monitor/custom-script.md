---
sidebar_position: 1
---

# Custom Script

Compared with traditional monitoring services, **Tianji** supports custom scripts to support more customized scenarios.

Here is some example

## Examples

### get available service number from health endpoint

```js
const res = await request({
  url: 'https://<tailchat-server-api>/health'
})

if(!res || !res.data || !res.data.services) {
  return -1
}

return res.data.services.length
```

### get github star count

```js
const res = await request({
  url: 'https://api.github.com/repos/msgbyte/tianji'
})

return res.data.stargazers_count ?? -1
```


### or more

Very very welcome to submit your script in this page. Tianji is driven by open source community.
