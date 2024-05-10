---
sidebar_position: 1
---

# Custom Script

Compared with traditional monitoring services, **Tianji** supports custom scripts to support more customized scenarios.

Essentially, you can understand it as a restricted, memory safe JavaScript runtime that accepts a number to display on your chart. The most common scenario is the time required for network requests to access an url. Of course, it can also be other things, such as your OpenAI balance, your github star number, and all the information that can be expressed in numbers.

if this script return -1, its means this work is failed, and try to send notification to you, just like normal monitor.

If you want to view the trend of a number's changes, opening the trending mode can help you better discover subtle changes in the number

Here is some example:

## Examples

### get tailchat available service number from health endpoint

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

replace `msgbyte/tianji` to your own repo name

### get docker pull count

```js
const res = await request({
  url: "https://hub.docker.com/v2/repositories/moonrailgun/tianji/"
});

return res.data.pull_count;
```

replace `moonrailgun/tianji` to your own image name


### or more

Very very welcome to submit your script in this page. Tianji is driven by open source community.
