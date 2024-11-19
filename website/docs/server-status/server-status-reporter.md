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

The **url** and **workspace** is required, its means you will report your service to which host and which workspace.

Default a server node name will be same with hostname, so you can custom your name with `--name` which can help you identify server.

## Auto install script

You can get your auto install script in `Tianji` -> `Servers` -> `Add` -> `Auto` tab

its will auto download reporter and create linux service in your machine. so its need root permission.

### Uninstall

if you wanna uninstall reporter service, you can use this command like:
```bash
curl -o- https://tianji.exmaple.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

major change is append `-s uninstall` after your install command.

## Q&A

### How to check tianji reporter service log?

If you install with auto install script, tianji will help you install a service which named `tianji-reporter` in your linux machine.

You can use this command to check tianji reporter log:

```bash
journalctl -fu tianji-reporter.service
```

### Not found your machine in server tab even report show success

Maybe your tianji is behind a reverse proxy for example `nginx`.

Please make sure your reverse proxy add websocket support

## Why my machine is always offline?

Please check your server datetime.
