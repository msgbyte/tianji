---
sidebar_position: 10
_i18n_hash: a89f05aed50f89d55367e4d1d6598373
---
# Variabel Lingkungan

Tianji mendukung berbagai variabel lingkungan untuk menyesuaikan perilakunya. Anda dapat mengkonfigurasi variabel ini di bidang `env` dalam docker compose atau melalui lingkungan penerapan Anda.

## Konfigurasi Dasar

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `PORT` | Port server | `12345` | `3000` |
| `JWT_SECRET` | Rahasia untuk token JWT | Teks Acak | `your-secret-key` |
| `ALLOW_REGISTER` | Izinkan pendaftaran pengguna | `false` | `true` |
| `ALLOW_OPENAPI` | Izinkan akses OpenAPI | `true` | `false` |
| `WEBSITE_ID` | Identifikasi situs web | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | Nonaktifkan pembersihan data otomatis | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | Nonaktifkan log akses | `false` | `true` |
| `DB_DEBUG` | Aktifkan debugging basis data | `false` | `true` |
| `ALPHA_MODE` | Aktifkan fitur alpha | `false` | `true` |
| `ENABLE_FUNCTION_WORKER` | Aktifkan pekerja fungsi | `false` | `true` |
| `REGISTER_AUTO_JOIN_WORKSPACE_ID` | ID ruang kerja untuk pengguna baru | - | `workspace-id-123` |

## Konfigurasi Cache

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `CACHE_MEMORY_ONLY` | Gunakan cache hanya di memori | `false` | `true` |
| `REDIS_URL` | URL koneksi Redis | - | `redis://localhost:6379` |

## Autentikasi

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | Nonaktifkan autentikasi berbasis akun | `false` | `true` |
| `AUTH_SECRET` | Rahasia autentikasi | MD5 dari rahasia JWT | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | Batasi pendaftaran ke domain email tertentu | - | `@example.com` |
| `AUTH_USE_SECURE_COOKIES` | Gunakan cookies aman untuk autentikasi | `false` | `true` |

### Autentikasi Email dan Undangan Email

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | Server SMTP untuk email | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | Alamat pengirim email | - | `noreply@example.com` |

### Autentikasi GitHub

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | ID klien OAuth GitHub | - | `your-github-client-id` |
| `AUTH_GITHUB_SECRET` | Rahasia klien OAuth GitHub | - | `your-github-client-secret` |

### Autentikasi Google

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | ID klien OAuth Google | - | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Rahasia klien OAuth Google | - | `your-google-client-secret` |

### Autentikasi OAuth/OIDC Kustom

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | ID klien OAuth/OIDC Kustom | - | `your-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | Rahasia klien OAuth/OIDC Kustom | - | `your-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | Nama penyedia kustom | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | Jenis autentikasi | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUER` | URL penerbit OIDC | - | `https://auth.example.com` |

## Fitur AI

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | Kunci API OpenAI | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | URL API OpenAI Kustom | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | Model OpenAI yang digunakan | `gpt-4o` | `gpt-3.5-turbo` |
| `SHARED_OPENAI_TOKEN_CALC_CONCURRENCY` | Konkurensi kalkulasi token | `5` | `10` |
| `DEBUG_AI_FEATURE` | Debug fitur AI | `false` | `true` |

## Konfigurasi ClickHouse

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `CLICKHOUSE_URL` | URL basis data ClickHouse | - | `http://localhost:8123` |
| `CLICKHOUSE_USER` | Nama pengguna ClickHouse | - | `default` |
| `CLICKHOUSE_PASSWORD` | Kata sandi ClickHouse | - | `your-password` |
| `CLICKHOUSE_DATABASE` | Nama basis data ClickHouse | - | `tianji` |
| `CLICKHOUSE_DEBUG` | Aktifkan debugging ClickHouse | `false` | `true` |
| `CLICKHOUSE_DISABLE_SYNC` | Nonaktifkan sinkronisasi ClickHouse | `false` | `true` |
| `CLICKHOUSE_SYNC_BATCH_SIZE` | Ukuran batch sinkronisasi | `10000` | `5000` |
| `CLICKHOUSE_ENABLE_FALLBACK` | Aktifkan fallback ClickHouse | `true` | `false` |
| `CLICKHOUSE_HEALTH_CHECK_INTERVAL` | Interval pengecekan kesehatan (ms) | `30000` | `60000` |
| `CLICKHOUSE_MAX_CONSECUTIVE_FAILURES` | Maksimum kegagalan berturut-turut | `3` | `5` |
| `CLICKHOUSE_RETRY_INTERVAL` | Interval percobaan ulang (ms) | `5000` | `10000` |

## Sistem Penagihan (LemonSqueezy)

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `ENABLE_BILLING` | Aktifkan fungsionalitas penagihan | `false` | `true` |
| `LEMON_SQUEEZY_SIGNATURE_SECRET` | Rahasia tanda tangan webhook LemonSqueezy | - | `your-signature-secret` |
| `LEMON_SQUEEZY_API_KEY` | Kunci API LemonSqueezy | - | `your-api-key` |
| `LEMON_SQUEEZY_STORE_ID` | ID toko LemonSqueezy | - | `your-store-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_FREE_ID` | ID varian langganan tier gratis | - | `free-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_PRO_ID` | ID varian langganan tier pro | - | `pro-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_TEAM_ID` | ID varian langganan tier tim | - | `team-variant-id` |

## Konfigurasi Sandbox

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `USE_VM2` | Gunakan VM2 untuk eksekusi sandbox | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | Batas memori sandbox (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Jalur kustom ke eksekusi Puppeteer | - | `/usr/bin/chromium` |

## Integrasi Peta

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | Token API AMap (Gaode) | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Token API Mapbox | - | `your-mapbox-token` |

## Telemetri

| Variabel | Deskripsi | Default | Contoh |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | Nonaktifkan telemetri anonim | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | Nama skrip pelacak kustom | - | `custom-tracker.js` |

## Menetapkan Variabel Lingkungan

Anda dapat menetapkan variabel lingkungan ini dengan beberapa cara:

1. Set langsung di lingkungan penerapan Anda (Docker, Kubernetes, dll.)

2. Untuk penerapan Docker, Anda dapat menggunakan variabel lingkungan di docker-compose.yml Anda:

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## Nilai Boolean

Untuk variabel lingkungan boolean, Anda dapat menggunakan `"1"` atau `"true"` untuk mengaktifkan fitur, dan mengabaikan variabel atau mengesetnya ke nilai lain untuk menonaktifkannya.
