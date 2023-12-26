---
sidebar_position: 1
---

# Deploy Tianji with Docker Compose

docker compose is most fast way to deploy `tianji`

You only need a few steps to complete the deployment

## Steps

download docker compose config:

```
wget https://raw.githubusercontent.com/msgbyte/tianji/master/docker-compose.yml
```

and change some env

```
vim docker-compose.yml
```

you should change `JWT_SECRET` to make your token safe. 

and change `SERVER_URL` to make sure you can quick run `install.sh` in server status report if you have many level gateway.

Then, run it!

```
docker compose up -d
```

its will start a postgresql and write init struct in database. if everything is ok, you can visit it in `http://127.0.0.1:12345`

and default account is `admin`/`admin`, dont forget change password!
