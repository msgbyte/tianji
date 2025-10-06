---
sidebar_position: 2
_i18n_hash: a82bcf148feb70ec31d10a96cffc2795
---
# Otentikasi

Dokumen ini memberikan instruksi terperinci tentang cara melakukan otentikasi dengan API Tianji, termasuk mendapatkan, menggunakan, dan mengelola kunci API.

## Metode Otentikasi

API Tianji menggunakan otentikasi **Bearer Token**. Anda perlu menyertakan kunci API Anda di header HTTP untuk setiap permintaan API.

### Format Header HTTP

```http
Authorization: Bearer <YOUR_API_KEY>
```

## Mendapatkan Kunci API

1. Masuk ke instance Tianji Anda
2. Klik pada avatar Anda di sudut kanan atas
3. Temukan bagian **API Keys**
4. Klik tombol + untuk membuat kunci API baru
5. Beri nama kunci API Anda dan simpan

## Pengelolaan Kunci API

### Melihat Kunci yang Ada

Di bagian **API Keys**, Anda dapat melihat:
- Nama/deskripsi kunci API
- Tanggal pembuatan
- Waktu terakhir digunakan
- Statistik jumlah penggunaan

### Menghapus Kunci API

Jika Anda perlu mencabut kunci API:
1. Temukan kunci API yang ingin Anda hapus
2. Klik tombol **Delete**
3. Konfirmasikan operasi penghapusan

:::warning Catatan
Setelah menghapus kunci API, semua aplikasi yang menggunakan kunci tersebut tidak akan dapat mengakses API lagi.
:::

## Menggunakan Kunci API

### Contoh cURL

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <your_api_key_here>" \
  -H "Content-Type: application/json"
```

### Contoh JavaScript/Node.js

```javascript
const apiKey = '<your_api_key_here>';
const baseUrl = 'https://your-tianji-domain.com/open';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

// Menggunakan fetch
const response = await fetch(`${baseUrl}/global/config`, {
  method: 'GET',
  headers: headers
});

// Menggunakan axios
const axios = require('axios');
const response = await axios.get(`${baseUrl}/global/config`, {
  headers: headers
});
```

### Contoh Python

```python
import requests

api_key = '<your_api_key_here>'
base_url = 'https://your-tianji-domain.com/open'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Menggunakan pustaka requests
response = requests.get(f'{base_url}/global/config', headers=headers)
data = response.json()
```

### Contoh PHP

```php
<?php
$apiKey = '<your_api_key_here>';
$baseUrl = 'https://your-tianji-domain.com/open';

$headers = [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/global/config');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
?>
```

## Izin dan Ruang Lingkup

### Izin Kunci API

Kunci API mewarisi semua izin dari pembuatnya, termasuk:
- Akses ke semua data di ruang kerja pengguna
- Menjalankan semua operasi yang diizinkan untuk pengguna
- Mengelola sumber daya yang dibuat oleh pengguna tersebut

### Akses Ruang Kerja

Kunci API hanya dapat mengakses ruang kerja yang dimiliki pengguna. Jika Anda perlu mengakses beberapa ruang kerja, pastikan akun pengguna Anda memiliki izin yang sesuai untuk ruang kerja tersebut.

## Penanganan Kesalahan

### Kesalahan Otentikasi Umum

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization not provided"
  }
}
```

**Penyebab**:
- Header Authorization tidak disediakan
- Format kunci API salah

#### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN", 
    "message": "Insufficient access"
  }
}
```

**Penyebab**:
- Kunci API tidak valid atau dihapus
- Pengguna tidak memiliki izin untuk mengakses sumber daya yang diminta

### Debugging Masalah Otentikasi

1. **Periksa format kunci API**: Pastikan Anda menggunakan format `Bearer token_here`
2. **Verifikasi keabsahan kunci**: Konfirmasikan kunci masih ada di antarmuka Tianji
3. **Periksa izin**: Pastikan akun pengguna memiliki izin untuk mengakses sumber daya target
4. **Uji titik akhir sederhana**: Mulai dengan menguji titik akhir publik seperti `/global/config`
