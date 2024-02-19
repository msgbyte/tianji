---
sidebar_position: 1
---

# Introduction

## What is Tianji

One sentence to summarize:

**Tianji** = **Website Analytics** + **Uptime Monitor** + **Server Status**

### Why is it called Tianji?

Tianji(天机, pronunciation Tiān Jī) in chinese which means **Heavenly Opportunity** or **Strategy**

The characters 天 (Tiān) and 机 (Jī) can be translated as "heaven" and "machine" or "mechanism" respectively. When combined, it might refer to a strategic or opportunistic plan or opportunity that seems to be orchestrated by a higher power or a celestial force.

## Motivation

During our observations of the website. We often need to use multiple applications together. For example, we need analysis tools such as `GA`/`umami` to check pv/uv and the number of visits to each page, we need an uptime monitor to check the network quality and connectivity of the server, and we need to use prometheus to obtain the status reported by the server to check the quality of the server. In addition, if we develop an application that allows open source deployment, we often need a telemetry system to help us collect the simplest information about other people's deployment situations.

I think these tools should serve the same purpose, so is there an application that can integrate these common needs in a lightweight way? After all, most of the time we don't need very professional and in-depth functions. But in order to achieve comprehensive monitoring, I need to install so many services.

It's good to specialize in one thing, if we are experts in related abilities we need such specialized tools. But for most users who only have lightweight needs, an **All-in-One** application will be more convenient and easier to use.

## Installation

Install Tianji with Docker is very simple. just make sure you have been install docker and docker-compose plugin

and then, run those command in anywhere:

```bash
wget https://raw.githubusercontent.com/msgbyte/tianji/master/docker-compose.yml
docker compose up -d
```

> Default account is **admin**/**admin**, please change password ASAP.

## Community

Join our thriving community to connect with fellow users, share experiences, and stay updated on the latest features and developments. Collaborate, ask questions, and contribute to the growth of the Tianji community.

- [GitHub](https://github.com/msgbyte/tianji)
- [Discord](https://discord.gg/8Vv47wAEej)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/tianji)
