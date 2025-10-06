---
sidebar_position: 20
_i18n_hash: e85199043ed7e89d1e71ea95a75b08df
---
# Konfigurasi Pemantauan Kontainer Docker

## Perilaku Pemantauan Default

Saat Anda menginstal Tianji menggunakan Docker atau Docker Compose, sistem secara otomatis mengaktifkan fungsi pemantauan server bawaan. Secara default:

- **Tianji secara otomatis memantau penggunaan sumber daya sistem kontainernya sendiri**
- Data pemantauan mencakup: penggunaan CPU, penggunaan memori, penggunaan disk, lalu lintas jaringan, dll.
- Data ini secara otomatis dilaporkan ke ruang kerja default tanpa konfigurasi tambahan
- Kontainer akan muncul sebagai `tianji-container` di dasbor pemantauan

## Memantau Semua Layanan Docker di Mesin Host

Jika Anda ingin Tianji memantau semua kontainer dan layanan Docker yang berjalan di mesin host, bukan hanya Tianji, Anda perlu memetakan Docker Socket ke dalam kontainer.

### Metode Konfigurasi

Tambahkan konfigurasi volumes berikut ke bagian layanan `tianji` dalam file `docker-compose.yml` Anda:

```yaml
services:
  tianji:
    image: moonrailgun/tianji
    # ... konfigurasi lainnya ...
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # ... konfigurasi lainnya ...
```

### Contoh Lengkap docker-compose.yml

```yaml
version: '3'
services:
  tianji:
    image: moonrailgun/tianji
    build:
      context: ./
      dockerfile: ./Dockerfile
    ports:
      - "12345:12345"
    environment:
      DATABASE_URL: postgresql://tianji:tianji@postgres:5432/tianji
      JWT_SECRET: ganti-dengan-string-acak
      ALLOW_REGISTER: "false"
      ALLOW_OPENAPI: "true"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # Tambahkan baris ini
    depends_on:
      - postgres
    restart: always
  postgres:
    # ... konfigurasi postgres ...
```

### Menggunakan Perintah Docker Run

Jika Anda memulai Tianji menggunakan perintah `docker run`, Anda bisa menambahkan parameter berikut:

```bash
docker run -d \
  --name tianji \
  -p 12345:12345 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  moonrailgun/tianji
```

## Efek Setelah Konfigurasi

Setelah menambahkan pemetaan Docker Socket, Tianji akan dapat:

- Memantau semua kontainer Docker yang berjalan di mesin host
- Mendapatkan informasi penggunaan sumber daya kontainer
- Menampilkan informasi status kontainer
- Memberikan tampilan pemantauan sistem yang lebih komprehensif
