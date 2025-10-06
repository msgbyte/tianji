---
sidebar_position: 1
_i18n_hash: bcb6522b66b64594f82548e296f77934
---
# Skrip Pelacak

## Instalasi

Untuk melacak kejadian dalam website, Anda hanya perlu menyisipkan skrip sederhana (< 2 KB) ke dalam website Anda.

Skripnya terlihat seperti di bawah ini:

```html
<script async defer src="https://<domain-hosting-anda>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Anda bisa mendapatkan kode skrip ini dari daftar website **Tianji** Anda.

## Lapor Kejadian

**Tianji** menyediakan cara sederhana untuk melaporkan kejadian klik pengguna. Ini memudahkan Anda melacak tindakan yang disukai dan sering digunakan oleh pengguna.

Ini adalah metode yang sangat umum dalam analisis website. Anda dapat dengan cepat menggunakannya dengan **Tianji**.

Setelah Anda menyisipkan kode skrip ke dalam website, Anda hanya perlu menambahkan `data-tianji-event` pada atribut dom.

Sebagai contoh:

```html
<button data-tianji-event="submit-login-form">Login</button>
```

Sekarang, ketika pengguna mengklik tombol ini, dasbor Anda akan menerima kejadian baru.

## Ubah Nama Skrip Bawaan

> Fitur ini tersedia pada v1.7.4+

Anda dapat menggunakan lingkungan `CUSTOM_TRACKER_SCRIPT_NAME` ketika memulainya.

Sebagai contoh:
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

Kemudian Anda bisa mengunjungi skrip pelacak Anda dengan `"https://<domain-hosting-anda>/my-tracker.js"`

Ini membantu menghindari beberapa pemblokir iklan.

Anda tidak memerlukan akhiran `.js`. Ini bisa berupa jalur mana saja yang Anda pilih, bahkan Anda bisa menggunakannya sebagai `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`

## Melacak Hanya Domain Tertentu

Umumnya pelacak akan melaporkan semua kejadian di mana pun situs Anda berjalan. Tapi terkadang kita perlu mengabaikan kejadian seperti `localhost`.

Tianji menyediakan atribut skrip pelacak untuk melakukan hal tersebut.

Anda bisa menambahkan `data-domains` ke dalam skrip Anda. Nilainya harus domain root yang ingin Anda lacak. Gunakan `,` untuk memisahkan beberapa domain.

```html
<script async defer src="https://<domain-hosting-anda>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Kemudian Anda hanya akan melihat kejadian dari domain-domain tersebut.
