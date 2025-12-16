---
sidebar_position: 7
_i18n_hash: 31c4981c02a399801d9f7185e51b5e44
---
Panduan Penggunaan SDK OpenAPI

Dokumen ini memberikan instruksi rinci tentang cara menggunakan SDK Tianji untuk memanggil antarmuka OpenAPI dan mencapai akses programatik lengkap ke layanan Tianji.

## Gambaran Umum

SDK OpenAPI Tianji didasarkan pada klien TypeScript yang dihasilkan secara otomatis, menyediakan metode pemanggilan API yang aman tipe. Melalui SDK ini, Anda dapat:

- Mengelola ruang kerja dan situs web
- Mengambil data analitik dan statistik
- Mengoperasikan proyek pemantauan
- Mengelola survei
- Menangani saluran dan acara Umpan
- ...

[Dokumentasi API Lengkap](/api)

## Pemasangan dan Inisialisasi

### Pasang SDK

```bash
npm install tianji-client-sdk
# atau
yarn add tianji-client-sdk
# atau
pnpm add tianji-client-sdk
```

### Inisialisasi Klien OpenAPI

```javascript
import { initOpenapiSDK } from 'tianji-client-sdk';

initOpenapiSDK('https://your-tianji-domain.com', {
  apiKey: 'your-api-key'
});
```

## API Konfigurasi Global

### Dapatkan Konfigurasi Sistem

```javascript
import { openApiClient } from 'tianji-client-sdk';

async function getSystemConfig() {
  try {
    const config = await openApiClient.GlobalService.globalConfig();
    
    console.log('Izinkan pendaftaran:', config.allowRegister);
    console.log('Fitur AI diaktifkan:', config.ai.enable);
    console.log('Penagihan diaktifkan:', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('Gagal mendapatkan konfigurasi sistem:', error);
  }
}
```
