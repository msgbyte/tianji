---
sidebar_position: 1
---

# Server Status Reporter

you can report your server status easily with tianji reporter

you can download from [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)

## Usage

```
Usage of tianji-reporter:
  --interval int
        Input the INTERVAL, seconed (default 5)
  --mode http
        The send mode of report data, you can select: `http` or `udp`, default is `http` (default "http")
  --name string
        The identification name for this machine
  --url string
        The http url of tianji, for example: https://tianji.msgbyte.com
  --vnstat
        Use vnstat for traffic statistics, linux only
  --workspace string
        The workspace id for tianji, this should be a uuid
```

the **url** and **workspace** is required, its means you will report your service to which host and which workspace.

default a server node name will be same with hostname, so you can custom your name with `--name` which can help you identify server.
