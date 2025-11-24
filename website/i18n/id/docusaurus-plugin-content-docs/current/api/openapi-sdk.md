---
sidebar_position: 7
_i18n_hash: f6c7dbe145cf9dcabd803f4db67fbe69
---
Panduan Penggunaan SDK OpenAPI

Dokumen ini memberikan instruksi rinci tentang cara menggunakan SDK Tianji untuk memanggil antar muka OpenAPI dan mencapai akses programatis sepenuhnya ke layanan Tianji.

## Gambaran Umum

SDK OpenAPI Tianji didasarkan pada klien TypeScript yang dihasilkan otomatis, menyediakan metode pemanggilan API yang aman tipe. Melalui SDK, Anda dapat:

- Mengelola ruang kerja dan situs web
- Mengambil data analitik dan statistik
- Mengoperasikan proyek pemantauan
- Mengelola survei
- Menangani saluran dan acara Feed
- ...

[Dokumentasi API Lengkap](/api)

## Instalasi dan Inisialisasi

### Instal SDK

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
    
    console.log('Mengizinkan pendaftaran:', config.allowRegister);
    console.log('Fitur AI diaktifkan:', config.ai.enable);
    console.log('Penagihan diaktifkan:', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('Gagal mendapatkan konfigurasi sistem:', error);
  }
}
```
