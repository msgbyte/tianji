---
sidebar_position: 1
_i18n_hash: 50d592e977b3f195d40bd2931b68269b
---
# Integrasi dengan MCP

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Tambahkan server tianji MCP ke Cursor" height="32" /></em></a>
<br />
[![Tambah ke Kiro](https://kiro.dev/images/add-to-kiro.svg)](https://kiro.dev/launch/mcp/add?name=tianji&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22tianji-mcp-server%22%5D%2C%22env%22%3A%7B%22TIANJI_BASE_URL%22%3A%22https%3A%2F%2Ftianji.example.com%22%2C%22TIANJI_API_KEY%22%3A%22%3Cyour-api-key%3E%22%2C%22TIANJI_WORKSPACE_ID%22%3A%22%3Cyour-workspace-id%3E%22%7D%7D)

## Pengenalan

Tianji MCP Server adalah server yang berbasis pada Model Context Protocol (MCP) yang berfungsi sebagai jembatan antara asisten AI dan platform Tianji. Ini mengekspos fungsi survei platform Tianji ke asisten AI melalui protokol MCP. Server ini menyediakan fitur inti berikut:

- Mencari hasil survei
- Mendapatkan informasi survei detail
- Mendapatkan semua survei dalam satu ruang kerja
- Mendapatkan daftar situs web

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

# Kunci API platform Tianji
TIANJI_API_KEY=your_api_key_here

# ID ruang kerja platform Tianji
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### Mendapatkan Kunci API

Anda dapat memperoleh kunci API platform Tianji dengan mengikuti langkah-langkah berikut:

1. Setelah masuk ke platform Tianji, klik pada **foto profil** Anda di pojok kanan atas
2. Pilih **Profil** dari menu dropdown
3. Pada halaman profil, temukan opsi **API Keys**
4. Klik untuk membuat kunci baru, dan ikuti petunjuk untuk menyelesaikan pembuatan kunci

## Instruksi Penggunaan

Tianji MCP Server menyediakan serangkaian alat yang dapat berinteraksi dengan asisten AI melalui protokol MCP. Berikut adalah deskripsi detail dari setiap alat:

### Mencari Hasil Survei

Gunakan alat `tianji_get_survey_results` untuk mencari data hasil dari survei tertentu.

**Parameter:**

- `workspaceId`: ID ruang kerja Tianji (standarnya adalah nilai yang dikonfigurasi dalam variabel lingkungan)
- `surveyId`: ID survei
- `limit`: Batas jumlah rekaman yang dikembalikan (standar 20)
- `cursor`: Kursor paginasi (opsional)
- `startAt`: Waktu mulai, format ISO, contoh: 2023-10-01T00:00:00Z
- `endAt`: Waktu berakhir, format ISO, contoh: 2023-10-31T23:59:59Z
- `filter`: Kondisi filter (opsional)

### Mendapatkan Informasi Survei

Gunakan alat `tianji_get_survey_info` untuk mendapatkan informasi dasar tentang survei tertentu.

**Parameter:**

- `workspaceId`: ID ruang kerja Tianji (standarnya adalah nilai yang dikonfigurasi dalam variabel lingkungan)
- `surveyId`: ID survei

### Mendapatkan Daftar Semua Survei

Gunakan alat `tianji_get_all_survey_list` untuk mendapatkan daftar semua survei dalam ruang kerja.

**Parameter:**

- `workspaceId`: ID ruang kerja Tianji (standarnya adalah nilai yang dikonfigurasi dalam variabel lingkungan)

### Mendapatkan Daftar Situs Web

Gunakan alat `tianji_get_website_list` untuk mendapatkan daftar situs web dalam ruang kerja.

**Parameter:**

- `workspaceId`: ID ruang kerja Tianji (standarnya adalah nilai yang dikonfigurasi dalam variabel lingkungan)

## Contoh Penggunaan

Berikut adalah contoh interaksi bahasa alami antara pengguna dan asisten AI yang terintegrasi dengan Tianji MCP Server:

### Contoh 1: Mendapatkan Daftar Semua Survei

```
Pengguna: Bantu saya melihat semua daftar kuesioner survei saya

Asisten AI: Saya akan mendapatkan semua daftar kuesioner survei Anda untuk Anda.
[Asisten AI memanggil tianji_get_all_survey_list melalui protokol MCP untuk mendapatkan data]
Berdasarkan data di ruang kerja Anda, saat ini Anda memiliki survei berikut:
1. Survei Kepuasan Pengalaman Pengguna (dibuat pada 2023-09-15)
2. Survei Umpan Balik Fitur Produk (dibuat pada 2023-10-01)
3. Penilaian Kegunaan Situs Web (dibuat pada 2023-10-20)
```

### Contoh 2: Mendapatkan Detail Survei Tertentu

```
Pengguna: Tolong beri tahu saya detail "Survei Kepuasan Pengalaman Pengguna"

Asisten AI: Saya akan mencari detail dari survei tersebut untuk Anda.
[Asisten AI memanggil tianji_get_survey_info melalui protokol MCP untuk mendapatkan data]
Detail dari "Survei Kepuasan Pengalaman Pengguna":
- Waktu pembuatan: 2023-09-15
- Status: Aktif
- Jumlah pertanyaan: 10
- Tanggapan yang diterima: 128
- Tanggapan terbaru: 2023-10-25
```

### Contoh 3: Mencari Hasil Survei

```
Pengguna: Bantu saya menganalisis hasil Oktober dari "Survei Umpan Balik Fitur Produk"

Asisten AI: Saya akan menganalisis hasil Oktober dari "Survei Umpan Balik Fitur Produk".
[Asisten AI memanggil tianji_get_survey_results melalui protokol MCP untuk mendapatkan data untuk rentang waktu tertentu]
Analisis hasil "Survei Umpan Balik Fitur Produk" Oktober:
- Tanggapan total: 42
- Fitur paling populer: Laporan Otomatis (85% umpan balik positif)
- Fitur yang paling perlu perbaikan: Adaptasi seluler (disebutkan oleh 62%)
- Rata-rata rating kepuasan: 4.2/5
- Saran utama pengguna: Tambahkan fungsi ekspor data, optimalkan kecepatan pemuatan halaman
```
