---
sidebar_position: 1
_i18n_hash: bf0ff03e7619ebadc59e7451f16ddf69
---
# Integrasi dengan MCP

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Tambahkan server Tianji MCP ke Cursor" height="32" /></em></a>

## Pengenalan

Tianji MCP Server adalah server berbasis Protokol Konteks Model (MCP) yang berfungsi sebagai jembatan antara asisten AI dan platform Tianji. Ini mengekspos fungsi survei platform Tianji ke asisten AI melalui protokol MCP. Server ini menyediakan fitur inti berikut:

- Kuery hasil survei
- Dapatkan informasi survei yang terperinci
- Dapatkan semua survei dalam ruang kerja
- Dapatkan daftar situs web

## Metode Instalasi

### Instalasi NPX

Anda dapat menggunakan Tianji MCP Server dengan menambahkan konfigurasi berikut ke file konfigurasi asisten AI Anda:

```json
{
  "mcpServers": {
    "tianji": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "tianji-mcp-server"
      ],
      "env": {
        "TIANJI_BASE_URL": "https://tianji.example.com",
        "TIANJI_API_KEY": "<your-api-key>",
        "TIANJI_WORKSPACE_ID": "<your-workspace-id>"
      }
    }
  }
}
```

### Konfigurasi Variabel Lingkungan

Sebelum menggunakan Tianji MCP Server, Anda perlu mengatur variabel lingkungan berikut:

```bash
# URL dasar API platform Tianji
TIANJI_BASE_URL=https://tianji.example.com

# API key platform Tianji
TIANJI_API_KEY=your_api_key_here

# ID ruang kerja platform Tianji
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### Mendapatkan API Key

Anda dapat memperoleh API key platform Tianji dengan mengikuti langkah-langkah berikut:

1. Setelah masuk ke platform Tianji, klik pada **gambar profil** Anda di pojok kanan atas
2. Pilih **Profile** dari menu dropdown
3. Pada halaman profil, temukan opsi **API Keys**
4. Klik buat kunci baru, dan ikuti petunjuk untuk menyelesaikan pembuatan kunci

## Instruksi Penggunaan

Tianji MCP Server menyediakan serangkaian alat yang dapat berinteraksi dengan asisten AI melalui protokol MCP. Di bawah ini adalah deskripsi terperinci dari setiap alat:

### Query Hasil Survei

Gunakan alat `tianji_get_survey_results` untuk kuery data hasil dari survei tertentu.

**Parameter:**

- `workspaceId`: ID ruang kerja Tianji (default ke nilai yang dikonfigurasikan dalam variabel lingkungan)
- `surveyId`: ID Survei
- `limit`: Batas jumlah catatan yang dikembalikan (default 20)
- `cursor`: Kursor paginasi (opsional)
- `startAt`: Waktu mulai, format ISO, contoh: 2023-10-01T00:00:00Z
- `endAt`: Waktu berakhir, format ISO, contoh: 2023-10-31T23:59:59Z
- `filter`: Kondisi penyaring (opsional)

### Dapatkan Informasi Survei

Gunakan alat `tianji_get_survey_info` untuk mendapatkan informasi dasar tentang survei tertentu.

**Parameter:**

- `workspaceId`: ID ruang kerja Tianji (default ke nilai yang dikonfigurasikan dalam variabel lingkungan)
- `surveyId`: ID Survei

### Dapatkan Daftar Semua Survei

Gunakan alat `tianji_get_all_survey_list` untuk mendapatkan daftar semua survei dalam ruang kerja.

**Parameter:**

- `workspaceId`: ID ruang kerja Tianji (default ke nilai yang dikonfigurasikan dalam variabel lingkungan)

### Dapatkan Daftar Situs Web

Gunakan alat `tianji_get_website_list` untuk mendapatkan daftar situs web dalam ruang kerja.

**Parameter:**

- `workspaceId`: ID ruang kerja Tianji (default ke nilai yang dikonfigurasikan dalam variabel lingkungan)

## Contoh Penggunaan

Berikut adalah contoh interaksi bahasa alami antara pengguna dan asisten AI yang terintegrasi dengan Tianji MCP Server:

### Contoh 1: Dapatkan Daftar Semua Survei

```
Pengguna: Tolong bantu saya melihat semua daftar kuesioner survei saya

Asisten AI: Saya akan mendapatkan semua daftar kuesioner survei Anda.
[Asisten AI memanggil tianji_get_all_survey_list melalui protokol MCP untuk mendapatkan data]
Berdasarkan data di ruang kerja Anda, saat ini Anda memiliki survei berikut:
1. Survei Kepuasan Pengalaman Pengguna (dibuat pada 2023-09-15)
2. Survei Umpan Balik Fitur Produk (dibuat pada 2023-10-01)
3. Penilaian Kegunaan Situs Web (dibuat pada 2023-10-20)
```

### Contoh 2: Dapatkan Detail Survei Tertentu

```
Pengguna: Tolong beri tahu saya detail dari "Survei Kepuasan Pengalaman Pengguna"

Asisten AI: Saya akan menanyakan detail dari survei itu untuk Anda.
[Asisten AI memanggil tianji_get_survey_info melalui protokol MCP untuk mendapatkan data]
Detail dari "Survei Kepuasan Pengalaman Pengguna":
- Waktu pembuatan: 2023-09-15
- Status: Aktif
- Jumlah pertanyaan: 10
- Respons yang terkumpul: 128
- Respons terbaru: 2023-10-25
```

### Contoh 3: Query Hasil Survei

```
Pengguna: Bantu saya menganalisis hasil Oktober dari "Survei Umpan Balik Fitur Produk"

Asisten AI: Saya akan menganalisis hasil Oktober dari "Survei Umpan Balik Fitur Produk".
[Asisten AI memanggil tianji_get_survey_results melalui protokol MCP untuk mendapatkan data dalam rentang waktu tertentu]
Analisis hasil Survei Umpan Balik Fitur Produk Oktober:
- Total respons: 42
- Fitur paling populer: Laporan Otomatis (85% umpan balik positif)
- Fitur yang paling perlu ditingkatkan: Adaptasi seluler (disebutkan oleh 62%)
- Rata-rata peringkat kepuasan: 4.2/5
- Saran utama pengguna: Tambahkan fungsionalitas ekspor data, optimalkan kecepatan pemuatan halaman
```
