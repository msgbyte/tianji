---
sidebar_position: 1
_i18n_hash: fbe38264a49d1d3af45c4417fdc9a108
---
# Pelacakan Aplikasi

Tianji menyediakan SDK yang kuat untuk melacak kejadian dan perilaku pengguna dalam aplikasi Anda. Panduan ini menjelaskan cara mengintegrasikan dan menggunakan SDK Pelacakan Aplikasi dalam proyek Anda.

## Instalasi

Pasang SDK Tianji untuk React Native dalam proyek Anda:

```bash
npm install tianji-react-native
# atau
yarn add tianji-react-native
# atau
pnpm add tianji-react-native
```

## Inisialisasi

Sebelum menggunakan fitur pelacakan apa pun, Anda perlu menginisialisasi SDK Aplikasi dengan URL server Tianji dan ID aplikasi Anda:

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // URL server Tianji Anda
  applicationId: 'your-application-id'      // Identifier aplikasi Anda
});
```

## Pelacakan Kejadian

Anda dapat melacak kejadian khusus dalam aplikasi Anda untuk memantau tindakan dan perilaku pengguna:

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// Lacak kejadian sederhana
reportApplicationEvent('Button Clicked');

// Lacak kejadian dengan data tambahan
reportApplicationEvent('Purchase Completed', {
  productId: 'product-123',
  price: 29.99,
  currency: 'USD'
});
```

## Pelacakan Layar

Lacak tampilan layar dalam aplikasi Anda untuk memahami pola navigasi pengguna:

### Menetapkan Layar Saat Ini

Anda dapat menetapkan informasi layar saat ini yang akan disertakan dalam kejadian berikutnya:

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// Perbarui layar saat ini ketika pengguna bernavigasi
updateCurrentApplicationScreen('ProductDetails', { productId: 'product-123' });
```

### Melaporkan Tampilan Layar

Secara eksplisit melaporkan kejadian tampilan layar:

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// Laporkan tampilan layar saat ini
reportApplicationScreenView();

// Atau laporkan tampilan layar tertentu
reportApplicationScreenView('Checkout', { cartItems: 3 });
```

#### Integrasi dengan expo-router

```tsx
import { useGlobalSearchParams, usePathname } from 'expo-router'
import { reportApplicationScreenView } from 'tianji-react-native'

function App() {
  const pathname = usePathname()
  const params = useGlobalSearchParams()

  useEffect(() => {
    reportApplicationScreenView(pathname, params)
  }, [pathname, params])
}
```

## Identifikasi Pengguna

Identifikasi pengguna dalam aplikasi Anda untuk melacak perilaku mereka di berbagai sesi:

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// Identifikasi pengguna dengan informasi mereka
identifyApplicationUser({
  id: 'user-123',          // Identifier unik pengguna
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
  - `serverUrl`: URL server Tianji Anda (mis. 'https://tianji.example.com')
  - `applicationId`: Identifier aplikasi Anda

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

Mengirimkan kejadian aplikasi ke server Tianji.

**Parameter:**

- `eventName`: Nama kejadian (maks 50 karakter)
- `eventData`: (Opsional) Objek data kejadian
- `screenName`: (Opsional) Nama layar untuk mengganti layar saat ini
- `screenParams`: (Opsional) Parameter layar untuk mengganti parameter layar saat ini

### `updateCurrentApplicationScreen(name, params)`

Memperbarui informasi layar aplikasi saat ini.

**Parameter:**

- `name`: Nama layar
- `params`: Objek parameter layar

### `reportApplicationScreenView(screenName?, screenParams?)`

Mengirimkan kejadian tampilan layar ke server Tianji.

**Parameter:**

- `screenName`: (Opsional) Nama layar untuk mengganti layar saat ini
- `screenParams`: (Opsional) Parameter layar untuk mengganti parameter layar saat ini

### `identifyApplicationUser(userInfo)`

Mengidentifikasi pengguna dalam aplikasi.

**Parameter:**

- `userInfo`: Objek data identifikasi pengguna

## Batasan Payload

- Informasi bahasa: maks 35 karakter
- Informasi sistem operasi: maks 20 karakter
- Informasi URL: maks 500 karakter
- Nama kejadian: maks 50 karakter
