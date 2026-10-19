---
sidebar_position: 2
_i18n_hash: 4ad4885ffd9d3dee0d40df9443ddf820
---
# Instalasi

Skill ini hanya terdiri dari tiga file. Agen AI modern (Cursor, Claude Code, Codex, Copilot CLI...) sudah mengetahui di mana direktori keahliannya masing-masing — jadi instalasi dapat sesederhana menempelkan satu prompt.

## Instalasi Satu Klik (melalui Agen AI)

Tempelkan prompt di bawah ke agen AI Anda. Agen akan mengunduh file ke dalam direktori keahlian yang tepat untuk platformnya, lalu meminta Anda untuk konfigurasi yang hilang.

```
Harap instal Tianji Data Query Skill ke dalam direktori keahlian Anda:

https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query

Setelah mengunduh, periksa apakah variabel lingkungan ini sudah disetel:
  - TIANJI_BASE_URL
  - TIANJI_API_KEY
  - TIANJI_WORKSPACE_ID

Jika ada yang hilang, tanyakan kepada saya untuk nilainya.
```

Itu saja. Agen memilih direktori keahliannya sendiri, mengambil file, dan meminta Anda untuk kredensial bila diperlukan.

## Instalasi Manual

Jika Anda lebih suka menginstalnya secara manual, pilih direktori target untuk agen Anda dan jalankan:

```bash
DEST="$HOME/.cursor/skills/tianji-data-query"   # atau apa pun yang digunakan agen Anda
mkdir -p "$DEST/references"

BASE="https://raw.githubusercontent.com/msgbyte/tianji/master/skills/tianji-data-query"
curl -fSL "$BASE/SKILL.md"                          -o "$DEST/SKILL.md"
curl -fSL "$BASE/references/api-endpoints.md"       -o "$DEST/references/api-endpoints.md"
curl -fSL "$BASE/references/openapi-readonly.json"  -o "$DEST/references/openapi-readonly.json"
```

### Direktori Keahlian Berdasarkan Agen

| Agen | Direktori |
|-------|-----------|
| Cursor (personal) | `~/.cursor/skills/tianji-data-query/` |
| Cursor (proyek)  | `<project-root>/.cursor/skills/tianji-data-query/` |
| Claude Code       | `~/.claude/skills/tianji-data-query/` |
| Codex             | `~/.codex/skills/tianji-data-query/` |
| Codex (alternatif) | `~/.agents/skills/tianji-data-query/` |

## Variabel Lingkungan yang Diperlukan

Skill ini membutuhkan tiga nilai. Ekspor mereka dalam shell rc Anda, atau setel mereka dalam konfigurasi skill agen Anda:

```bash
# URL dasar instance Tianji
TIANJI_BASE_URL=https://tianji.example.com

# Kunci API untuk autentikasi
TIANJI_API_KEY=your_api_key_here

# ID ruang kerja bawaan
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### Mendapatkan Kunci API

1. Masuk ke instance Tianji Anda dan klik **foto profil** Anda di pojok kanan atas.
2. Pilih **Profil** dari menu dropdown.
3. Temukan bagian **Kunci API**.
4. Klik **Buat kunci baru** dan ikuti petunjuknya.

## Langkah Selanjutnya

Setelah instalasi, kembali ke [Integrasi dengan Agen Skill](./skill.md) untuk melihat contoh penggunaan, perbandingan dengan Server MCP, dan cara skill menangani data sensitif.
