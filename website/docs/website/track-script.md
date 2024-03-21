---
sidebar_position: 1
---

# Track Script

## Install

To track website events, you just need inject a simple script(<2kb) into your website.

the script look like below:

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

you can get this script code from your **Tianji** website list

## Report Event

**Tianji** provide a simple way to report user click event, its easy to help you track which action user like and often to use.

This is a very common method in website analysis. You can use it quickly get it by using **Tianji**.

After you inject script code into your website, you just need add a `data-tianji-event` in dom attribute.

for example:

```html
<button data-tianji-event="submit-login-form">Login</button>
```

Now, when user click this button, your dashboard will receive new event


## Modify default script name

> This feature available on v1.7.4+

You can use environment `CUSTOM_TRACKER_SCRIPT_NAME` when you start it

for example:
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

then you can visit your tracker script with `"https://<your-self-hosted-domain>/my-tracker.js"`

This is to help you avoid some ad-blockers.

You do not need the `.js` suffix. It can be any path you choose, even you can use as `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`
