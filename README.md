[![CI](https://github.com/msgbyte/tianji/actions/workflows/ci.yaml/badge.svg)](https://github.com/msgbyte/tianji/actions/workflows/ci.yaml)
[![Build Reporter Release](https://github.com/msgbyte/tianji/actions/workflows/reporter-release.yml/badge.svg)](https://github.com/msgbyte/tianji/actions/workflows/reporter-release.yml)
[![Docker Build CI](https://github.com/msgbyte/tianji/actions/workflows/ci-docker.yaml/badge.svg)](https://github.com/msgbyte/tianji/actions/workflows/ci-docker.yaml)
![Docker Pulls](https://img.shields.io/docker/pulls/moonrailgun/tianji)
![Docker Image Size](https://img.shields.io/docker/image-size/moonrailgun/tianji)
![Tianji Visitor](https://tianji.moonrailgun.com/telemetry/clnzoxcy10001vy2ohi4obbi0/cltjxvcwm02wdut4e106maek7/badge.svg)

# Tianji

<img src="./website/static/img/logo.svg" width="128" />

**All-in-One Insight Hub**

`Website analytics` + `Uptime Monitor`  + `Server Status` = `Tianji`

All in one project!

## Motivation

During our observations of the website. We often need to use multiple applications together. For example, we need analysis tools such as `GA`/`umami` to check pv/uv and the number of visits to each page, we need an uptime monitor to check the network quality and connectivity of the server, and we need to use prometheus to obtain the status reported by the server to check the quality of the server. In addition, if we develop an application that allows open source deployment, we often need a telemetry system to help us collect the simplest information about other people's deployment situations.

I think these tools should serve the same purpose, so is there an application that can integrate these common needs in a lightweight way? After all, most of the time we don't need very professional and in-depth functions. But in order to achieve comprehensive monitoring, I need to install so many services.

It's good to specialize in one thing, if we are experts in related abilities we need such specialized tools. But for most users who only have lightweight needs, an **All-in-One** application will be more convenient and easier to use.

## Roadmap

- [x] website analysis
- [x] monitor
- [x] server status
- [x] problem notification
- [x] telemetry
- [x] openapi
- [x] website
- [ ] team collaboration
- [ ] utm track
- [ ] waitlist
- [ ] survey
- [ ] lighthouse report
- [ ] hooks
- [ ] links

## Preview

![](./website/static/img/preview1.png)

![](./website/static/img/preview2.png)

![](./website/static/img/preview3.png)

## Open Source

`Tianji` is open source with `Apache 2.0` license.

And its inspired by `umami` license which under `MIT` and `uptime-kuma` which under `MIT` license too
