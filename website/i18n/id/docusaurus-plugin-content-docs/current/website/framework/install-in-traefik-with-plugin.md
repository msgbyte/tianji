---
sidebar_position: 2
_i18n_hash: f85f95f54fdfadadf81712ccb1401e46
---
# Instalasi di Traefik dengan plugin

Tianji menyediakan plugin Traefik yang memungkinkan Anda dengan mudah mengintegrasikan fungsionalitas analitik situs web Tianji ke dalam proxy Traefik Anda.

## Gambaran Umum Plugin

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin) adalah plugin middleware Traefik yang dikembangkan khusus untuk Tianji yang dapat secara otomatis menyisipkan skrip pelacakan Tianji ke dalam situs web Anda tanpa mengubah kode situs web Anda untuk mulai mengumpulkan data pengunjung.

## Memasang Plugin

### 1. Tambahkan Plugin pada Konfigurasi Statis

Pertama, Anda perlu menambahkan referensi plugin dalam konfigurasi statis Traefik. Nomor versi plugin merujuk pada tag git.

#### Konfigurasi YAML

Tambahkan yang berikut ke `traefik.yml` atau file konfigurasi statis Anda:

```yaml
experimental:
  plugins:
    traefik-tianji-plugin:
      moduleName: "github.com/msgbyte/traefik-tianji-plugin"
      version: "v0.2.1"
```

#### Konfigurasi TOML

```toml
[experimental.plugins.traefik-tianji-plugin]
  moduleName = "github.com/msgbyte/traefik-tianji-plugin"
  version = "v0.2.1"
```

#### Baris Perintah

```bash
--experimental.plugins.traefik-tianji-plugin.modulename=github.com/msgbyte/traefik-tianji-plugin
--experimental.plugins.traefik-tianji-plugin.version=v0.2.1
```

### 2. Konfigurasi Middleware

Setelah memasang plugin, Anda perlu mengonfigurasi middleware dalam konfigurasi dinamis.

#### Konfigurasi Dinamis YAML

Dalam `config.yml` atau file konfigurasi dinamis Anda:

```yaml
http:
  middlewares:
    my-tianji-middleware:
      plugin:
        traefik-tianji-plugin:
          tianjiHost: "https://tianji.your-domain.com"
          websiteId: "your-website-id"
```

#### Konfigurasi Dinamis TOML

```toml
[http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin]
  tianjiHost = "https://tianji.your-domain.com"
  websiteId = "your-website-id"
```

#### Label Docker Compose

```yaml
version: '3.7'
services:
  my-app:
    image: nginx:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.my-app.rule=Host(`my-app.local`)"
      - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.tianjiHost=https://tianji.your-domain.com"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.websiteId=your-website-id"
```

## Parameter Konfigurasi

### Parameter Wajib

- **tianjiHost**: URL lengkap server Tianji Anda
  - Contoh: `https://tianji.your-domain.com`
  - Jika menggunakan layanan resmi: `https://app.tianji.dev`

- **websiteId**: ID situs web yang dibuat di Tianji
  - Dapat ditemukan di pengaturan situs web dari panel admin Tianji Anda

### Parameter Opsional

Plugin ini juga mendukung parameter konfigurasi lainnya untuk menyesuaikan perilaku. Untuk parameter spesifik, silakan merujuk ke [dokumentasi repositori GitHub](https://github.com/msgbyte/traefik-tianji-plugin).

## Menggunakan Middleware

Setelah konfigurasi, Anda perlu menggunakan middleware ini di router Anda:

### Konfigurasi YAML

```yaml
http:
  routers:
    my-app:
      rule: "Host(`my-app.local`)"
      middlewares:
        - "my-tianji-middleware"
      service: "my-app-service"
```

### Label Docker Compose

```yaml
labels:
  - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
```

## Cara Kerjanya

1. Ketika permintaan melewati proxy Traefik, plugin memeriksa konten respons
2. Jika respons adalah konten HTML, plugin secara otomatis menyisipkan skrip pelacakan Tianji
3. Skrip mulai mengumpulkan data pengunjung dan mengirimkannya ke server Tianji ketika halaman dimuat

## Catatan Penting

- Pastikan alamat server Tianji dapat diakses dari browser klien
- ID situs web harus valid, jika tidak data tidak dapat dikumpulkan dengan benar
- Plugin hanya berfungsi ketika tipe konten respons adalah HTML
- Disarankan untuk menggunakan versi terbaru dari plugin untuk kinerja dan fitur yang optimal

## Referensi

- [Kode Sumber Plugin](https://github.com/msgbyte/traefik-tianji-plugin)
- [Dokumentasi Plugin Traefik](https://doc.traefik.io/traefik/plugins/)
