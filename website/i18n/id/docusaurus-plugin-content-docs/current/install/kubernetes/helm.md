---
sidebar_position: 1
_i18n_hash: c95e9693eac4df676574d4eb8357881d
---
# Instalasi dengan Helm

Helm adalah alat yang memudahkan penginstalan dan pengelolaan aplikasi Kubernetes. Dengan helm, Anda dapat dengan mudah dan cepat menikmati tianji di Kubernetes.

## Tambahkan repo

Pertama, Anda harus menambahkan registri chart msgbyte ke dalam daftar repo helm.

```bash
helm repo add msgbyte https://msgbyte.github.io/charts
```

Sekarang Anda dapat mencari tianji dengan perintah `helm search`.

```bash
helm search repo tianji
```

## Instal 

Kemudian, Anda bebas untuk menginstal dengan satu perintah:

```bash
helm install tianji msgbyte/tianji
```

Ini akan menghadirkan Anda sebuah database pg dan tianji.
