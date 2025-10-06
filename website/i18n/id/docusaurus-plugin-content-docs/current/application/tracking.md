---
sidebar_position: 1
_i18n_hash: ae151f338aa838eaab15a19bfea78d7f
---
# Pelacakan Aplikasi

Tianji menyediakan SDK yang kuat untuk melacak acara dan perilaku pengguna di aplikasi Anda. Panduan ini menjelaskan cara mengintegrasikan dan menggunakan SDK Pelacakan Aplikasi dalam proyek Anda.

## Instalasi

Pasang Tianji react native SDK di proyek Anda:

```bash
npm install tianji-react-native
# atau
yarn add tianji-react-native
# atau
pnpm add tianji-react-native
```

## Inisialisasi

Sebelum menggunakan fitur pelacakan, Anda perlu menginisialisasi SDK Aplikasi dengan URL server Tianji dan ID aplikasi Anda:

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // URL server Tianji Anda
  applicationId: 'your-application-id'      // Pengidentifikasi aplikasi Anda
});
```

## Pelacakan Acara

Anda dapat melacak acara khusus dalam aplikasi Anda untuk memantau tindakan dan perilaku pengguna:

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// Melacak acara sederhana
reportApplicationEvent('Button Clicked');

// Melacak acara dengan data tambahan
reportApplicationEvent('Purchase Completed', {
  productId: 'product-123',
  price: 29.99,
  currency: 'USD'
});
```

## Pelacakan Halaman

Lacak tampilan layar dalam aplikasi Anda untuk memahami pola navigasi pengguna:

### Menetapkan Layar Saat Ini

Anda dapat menetapkan informasi layar saat ini yang akan dimasukkan dalam acara berikutnya:

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// Perbarui layar saat ini saat pengguna bernavigasi
updateCurrentApplicationScreen('ProductDetails', { productId: 'product-123' });
```

### Melaporkan Tampilan Layar

Secara eksplisit laporkan acara tampilan layar:

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// Laporkan tampilan layar saat ini
reportApplicationScreenView();

// Atau laporkan tampilan layar tertentu
reportApplicationScreenView('Checkout', { cartItems: 3 });
```

## Identifikasi Pengguna

Identifikasi pengguna dalam aplikasi Anda untuk melacak perilaku mereka di berbagai sesi:

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// Identifikasi pengguna dengan informasi mereka
identifyApplicationUser({
  id: 'user-123',          // Pengidentifikasi pengguna unik
  email: 'user@example.com',
  name: 'John Doe',
  // Tambahkan properti pengguna lainnya
  plan: 'premium',
  signupDate: '2023-01-15'
});
```

## Referensi API

### `initApplication(options)`

Menginisialisasi SDK pelacakan aplikasi.

**Parameter:**

- `options`: ApplicationTrackingOptions
  - `serverUrl`: URL server Tianji Anda (misal, 'https://tianji.example.com')
  - `applicationId`: Pengidentifikasi aplikasi Anda

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

Mengirim acara aplikasi ke server Tianji.

**Parameter:**

- `eventName`: Nama acara (maks 50 karakter)
- `eventData`: (Opsional) Objek data acara
- `screenName`: (Opsional) Nama layar untuk menimpa layar saat ini
- `screenParams`: (Opsional) Parameter layar untuk menimpa parameter layar saat ini

### `updateCurrentApplicationScreen(name, params)`

Memperbarui informasi layar aplikasi saat ini.

**Parameter:**

- `name`: Nama layar
- `params`: Objek parameter layar

### `reportApplicationScreenView(screenName?, screenParams?)`

Mengirim acara tampilan layar ke server Tianji.

**Parameter:**

- `screenName`: (Opsional) Nama layar untuk menimpa layar saat ini
- `screenParams`: (Opsional) Parameter layar untuk menimpa parameter layar saat ini

### `identifyApplicationUser(userInfo)`

Mengidentifikasi pengguna dalam aplikasi.

**Parameter:**

- `userInfo`: Objek data identifikasi pengguna

## Batasan Payload

- Informasi bahasa: maks 35 karakter
- Informasi sistem operasi: maks 20 karakter
- Informasi URL: maks 500 karakter
- Nama acara: maks 50 karakter
