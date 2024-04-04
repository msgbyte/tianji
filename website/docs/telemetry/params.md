---
sidebar_position: 2
---

# Parameters

Here is some example for how to use and config with telemetry image.

All is optional. its will improve your usage in different place.

| name | description |
| -------- | --------- |
| url | default will get referrer url which auto generate by browser, but in some website will dont allow carry this header, so you have to bring it by your self. if Tianji cannot get url in any where, system will ignore and not record this visit |
| name | define telemetry event name, its can be use for distinguish different event but in same telemetry record. |
| title | **[Badge ONLY]**, define badge title |
| start | **[Badge ONLY]**, define badge start count number |
| fullNum | **[Badge ONLY]**, define badge will show full number, default is abbreviated digits(for example: `12345` and `12.3k`) |

## How to use

Its easy to carry params on url

for example:

```
https://tianji.example.com/telemetry/<workspaceId>/<telemetryId>/badge.svg?name=myEvent&url=https://google.com&title=My+Counter&start=100000&fullNum=true
```

If you dont familiar with this, you can check wiki page about this: [https://en.wikipedia.org/wiki/Query_string](https://en.wikipedia.org/wiki/Query_string)
