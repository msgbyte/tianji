---
sidebar_position: 1
_i18n_hash: ef9fc0eb6072a8f037b70ff2b56e12ae
---
# Skrip Pelacak

## Instalasi

Untuk melacak kejadian di situs web, Anda hanya perlu menyuntikkan skrip sederhana (< 2 KB) ke dalam situs web Anda.

Skrip tersebut terlihat seperti di bawah ini:

```html
<script async defer src="https://<domain-hosting-sendiri-anda>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Anda bisa mendapatkan kode skrip ini dari daftar situs web **Tianji** Anda

## Laporan Kejadian

**Tianji** menyediakan cara sederhana untuk melaporkan kejadian klik pengguna, sangat mudah untuk membantu Anda melacak tindakan mana yang disukai pengguna dan sering digunakan.

Ini adalah metode yang sangat umum dalam analisis situs web. Anda bisa menggunakannya dengan cepat menggunakan **Tianji**.

### Penggunaan Dasar

Setelah Anda menyuntikkan kode skrip ke dalam situs web Anda, Anda hanya perlu menambahkan `data-tianji-event` dalam atribut dom.

Misalnya:

```html
<button data-tianji-event="submit-login-form">Masuk</button>
```

Sekarang, ketika pengguna mengklik tombol ini, dasbor Anda akan menerima kejadian baru

### Lampirkan Data Kejadian

Anda bisa melampirkan data tambahan ke kejadian Anda dengan menggunakan atribut `data-tianji-event-{key}`. Setiap atribut yang cocok dengan pola ini akan dikumpulkan dan dikirimkan bersamaan dengan kejadian tersebut.

```html
<button 
  data-tianji-event="purchase" 
  data-tianji-event-product="Paket Premium"
  data-tianji-event-price="99"
  data-tianji-event-currency="USD">
  Beli Sekarang
</button>
```

Ini akan mengirimkan kejadian bernama `purchase` dengan data berikut:
```json
{
  "product": "Paket Premium",
  "price": "99",
  "currency": "USD"
}
```

### Lacak Klik Tautan

Saat menggunakan `data-tianji-event` pada tag anchor (`<a>`), **Tianji** menangani mereka secara khusus untuk memastikan kejadian dilacak sebelum navigasi:

```html
<a href="/pricing" data-tianji-event="view-pricing">Lihat Harga</a>
```

Untuk tautan internal (tidak dibuka di tab baru), pelacak akan:
1. Mencegah navigasi default
2. Mengirim kejadian pelacakan
3. Menavigasi ke URL target setelah pelacakan selesai

Untuk tautan eksternal atau tautan dengan `target="_blank"`, kejadian dilacak tanpa memblokir navigasi.

### API JavaScript

Setelah skrip pelacak dimuat, Anda juga bisa melacak kejadian secara programatis menggunakan objek `window.tianji`.

#### Melacak Kejadian Kustom

```javascript
// Pelacakan kejadian sederhana
window.tianji.track('button-clicked');

// Kejadian dengan data kustom
window.tianji.track('purchase', {
  product: 'Paket Premium',
  price: 99,
  currency: 'USD'
});

// Lacak dengan objek payload kustom
window.tianji.track({
  website: 'your-website-id',
  name: 'custom-event',
  data: { key: 'value' }
});

// Lacak menggunakan fungsi (menerima info halaman saat ini)
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamic-event',
  data: { timestamp: Date.now() }
}));
```

#### Identifikasi Pengguna

Anda bisa melampirkan informasi pengguna ke sesi pelacakan:

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

Informasi ini akan dikaitkan dengan kejadian yang berikutnya dari pengguna ini.

## Memodifikasi Nama Skrip Default

> Fitur ini tersedia pada v1.7.4+

Anda bisa menggunakan lingkungan `CUSTOM_TRACKER_SCRIPT_NAME` saat Anda memulainya

misalnya:
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

kemudian Anda bisa mengunjungi skrip pelacak Anda dengan `"https://<domain-hosting-sendiri-anda>/my-tracker.js"`

Ini untuk membantu Anda menghindari beberapa pemblokir iklan.

Anda tidak perlu suffix `.js`. Ini bisa menjadi path apa pun yang Anda pilih, bahkan Anda bisa menggunakan seperti `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`

## Melacak Hanya Domain Tertentu

Umumnya pelacak akan melaporkan semua kejadian di mana pun situs Anda berjalan. Tetapi terkadang kita perlu mengabaikan kejadian seperti `localhost`.

Tianji menyediakan atribut dari skrip pelacak untuk itu.

Anda bisa menambahkan `data-domains` ke dalam skrip Anda. Nilainya harus merupakan domain root Anda untuk dilacak. Gunakan `,` untuk memisahkan beberapa domain.

```html
<script async defer src="https://<domain-hosting-sendiri-anda>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Kemudian Anda hanya bisa melihat kejadian dari domain-domain ini.
