---
sidebar_position: 1
_i18n_hash: b3805dea583e9b96a5bf32e57ff9c130
---
# Skrip Kustom

Dibandingkan dengan layanan pemantauan tradisional, **Tianji** mendukung skrip kustom untuk mendukung skenario yang lebih terpersonalisasi.

Pada dasarnya, Anda dapat memahaminya sebagai runtime JavaScript yang aman memori dan terbatas yang menerima angka untuk ditampilkan pada grafik Anda. Skenario paling umum adalah waktu yang dibutuhkan untuk permintaan jaringan mengakses sebuah URL. Tentu saja, bisa juga hal lain, seperti saldo OpenAI Anda, jumlah bintang github Anda, dan semua informasi yang dapat dinyatakan dalam angka.

Jika skrip ini mengembalikan -1, itu berarti kerja ini gagal, dan mencoba untuk mengirimkan notifikasi kepada Anda, seperti monitor normal.

Jika Anda ingin melihat tren perubahan angka, membuka mode tren dapat membantu Anda lebih baik dalam menemukan perubahan kecil pada angka tersebut.

Berikut adalah beberapa contohnya:

## Contoh

### mendapatkan jumlah layanan tailchat yang tersedia dari endpoint kesehatan

```js
const res = await request({
  url: 'https://<tailchat-server-api>/health'
})

if(!res || !res.data || !res.data.services) {
  return -1
}

return res.data.services.length
```

### mendapatkan jumlah bintang github

```js
const res = await request({
  url: 'https://api.github.com/repos/msgbyte/tianji'
})

return res.data.stargazers_count ?? -1
```

ganti `msgbyte/tianji` dengan nama repo Anda sendiri

### mendapatkan jumlah tarikan docker

```js
const res = await request({
  url: "https://hub.docker.com/v2/repositories/moonrailgun/tianji/"
});

return res.data.pull_count;
```

ganti `moonrailgun/tianji` dengan nama image Anda sendiri

### contoh untuk mencocokkan teks

```js
const start = Date.now();
const res = await request({
  url: "https://example.com/"
});

const usage = Date.now() - start;

const matched = /maintain/.test(String(res.data));

if(matched) {
  return -1;
}

return usage;
```

mengembalikan `-1` berarti ada sesuatu yang salah. dalam kasus ini, berarti dalam isi html terdapat teks `maintain`.

### atau lebih

Sangat sangat menyambut untuk mengirimkan skrip Anda di halaman ini. Tianji didorong oleh komunitas open source.
