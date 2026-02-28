---
sidebar_position: 1
_i18n_hash: 21ae6837de110e1b576fdf570bbbea6c
---
# Skrip Pelacak

## Instalasi

Untuk melacak peristiwa situs web, Anda hanya perlu menyematkan skrip sederhana (< 2 KB) ke dalam situs web Anda.

Skripnya terlihat seperti di bawah ini:

```html
<script async defer src="https://<domain-host-sendiri-anda>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Anda dapat mendapatkan kode skrip ini dari daftar situs web **Tianji** Anda.

## Atribut Skrip

Skrip pelacak mendukung atribut `data-*` berikut pada tag `<script>`:

| Atribut | Diperlukan | Default | Deskripsi |
|---|---|---|---|
| `data-website-id` | **Ya** | — | ID situs web unik untuk mengasosiasikan data pelacakan. Pelacak tidak akan diinisialisasi tanpanya. |
| `data-host-url` | Tidak | Asal `src` Skrip | URL server belakang. Jika dihilangkan, secara otomatis berasal dari path `src` skrip. |
| `data-auto-track` | Tidak | `true` | Melacak tampilan halaman dan perubahan rute secara otomatis. Atur ke `"false"` untuk menonaktifkan. |
| `data-do-not-track` | Tidak | — | Jika diatur, menghormati pengaturan Do Not Track (DNT) dari browser dan menonaktifkan pelacakan jika DNT diaktifkan. |
| `data-domains` | Tidak | — | Daftar domain yang dipisahkan koma untuk dilacak (mis. `"example.com,www.example.com"`). Pelacakan hanya aktif ketika nama host saat ini cocok dengan salah satu domain ini. |

### Contoh Lengkap

```html
<script
  async
  defer
  src="https://example.com/tracker.js"
  data-website-id="clxxxxxxxxxxxxxxxxxx"
  data-host-url="https://analytics.example.com"
  data-auto-track="true"
  data-do-not-track="true"
  data-domains="example.com,www.example.com"
></script>
```

### Menonaktifkan Pelacakan melalui localStorage

Anda juga dapat menonaktifkan pelacakan pada waktu berjalan dengan mengatur flag localStorage:

```javascript
localStorage.setItem('tianji.disabled', '1');
```

## Melaporkan Peristiwa

**Tianji** menyediakan cara sederhana untuk melaporkan peristiwa klik pengguna, yang mudah membantu Anda melacak tindakan mana yang disukai pengguna dan sering digunakan.

Ini adalah metode yang sangat umum dalam analisis situs web. Anda dapat menggunakannya dengan cepat menggunakan **Tianji**.

### Penggunaan Dasar

Setelah Anda menyematkan kode skrip ke dalam situs web Anda, Anda hanya perlu menambahkan `data-tianji-event` dalam atribut DOM.

misalnya:

```html
<button data-tianji-event="submit-login-form">Login</button>
```

Sekarang, ketika pengguna mengklik tombol ini, dasbor Anda akan menerima peristiwa baru.

### Melampirkan Data Peristiwa

Anda dapat melampirkan data tambahan ke peristiwa Anda dengan menggunakan atribut `data-tianji-event-{key}`. Setiap atribut yang cocok dengan pola ini akan dikumpulkan dan dikirim bersama peristiwa.

```html
<button 
  data-tianji-event="purchase" 
  data-tianji-event-product="Premium Plan"
  data-tianji-event-price="99"
  data-tianji-event-currency="USD">
  Beli Sekarang
</button>
```

Ini akan mengirimkan peristiwa bernama `purchase` dengan data berikut:
```json
{
  "product": "Premium Plan",
  "price": "99",
  "currency": "USD"
}
```

### Melacak Klik Tautan

Saat menggunakan `data-tianji-event` pada tag jangkar (`<a>`), **Tianji** menangani mereka secara khusus untuk memastikan peristiwa dilacak sebelum navigasi:

```html
<a href="/pricing" data-tianji-event="view-pricing">Cek Harga</a>
```

Untuk tautan internal (tidak membuka di tab baru), pelacak akan:
1. Mencegah navigasi default
2. Mengirim peristiwa pelacakan
3. Menavigasi ke URL target setelah pelacakan selesai

Untuk tautan eksternal atau tautan dengan `target="_blank"`, peristiwa dilacak tanpa memblokir navigasi.

### API JavaScript

Setelah skrip pelacak dimuat, Anda juga dapat melacak peristiwa secara programatis menggunakan objek `window.tianji`.

#### Melacak Peristiwa Kustom

```javascript
// Pelacakan peristiwa sederhana
window.tianji.track('button-clicked');

// Peristiwa dengan data kustom
window.tianji.track('purchase', {
  product: 'Premium Plan',
  price: 99,
  currency: 'USD'
});

// Melacak dengan objek payload kustom
window.tianji.track({
  website: 'your-website-id',
  name: 'custom-event',
  data: { key: 'value' }
});

// Melacak menggunakan fungsi (menerima info halaman saat ini)
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamic-event',
  data: { timestamp: Date.now() }
}));
```

#### Mengidentifikasi Pengguna

Anda dapat melampirkan informasi pengguna ke sesi pelacakan:

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

Informasi ini akan dikaitkan dengan peristiwa berikutnya dari pengguna ini.

## Memodifikasi Nama Skrip Default

> Fitur ini tersedia pada v1.7.4+

Anda dapat menggunakan lingkungan `CUSTOM_TRACKER_SCRIPT_NAME` saat memulainya

misalnya:
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

kemudian Anda dapat mengunjungi skrip pelacak Anda dengan `"https://<domain-host-sendiri-anda>/my-tracker.js"`

Ini untuk membantu Anda menghindari beberapa pemblokir iklan.

Anda tidak perlu akhiran `.js`. Itu dapat berupa path apa pun yang Anda pilih, bahkan Anda dapat menggunakan `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`.

## Melacak Hanya Domain Tertentu

Umumnya pelacak akan melaporkan semua peristiwa di mana pun situs Anda berjalan. Namun terkadang kita perlu mengabaikan peristiwa seperti `localhost`.

Tianji menyediakan atribut skrip pelacak untuk melakukan itu.

Anda dapat menambahkan `data-domains` ke dalam skrip Anda. Nilainya harus berupa domain root yang ingin Anda lacak. Gunakan `,` untuk memisahkan beberapa domain.

```html
<script async defer src="https://<domain-host-sendiri-anda>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Kemudian Anda dapat melihat peristiwa hanya dari domain tersebut.
