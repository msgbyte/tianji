---
sidebar_position: 1
---

# Tracker Script

## Installation

To track website events, you just need inject a simple script(< 2 KB) into your website.

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

## Tracking Specified Domains Only

Generally the tracker will report all events wherever your site is running. But sometimes we need to ignore events like `localhost`.

Tianji provides an attribute of the tracker script to do that.

You can add `data-domains` into your script. The value should be your root domains to track. Use `,` to separate multiple domains.

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Then you can just see the events from these domains.
