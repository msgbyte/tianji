---
sidebar_position: 1
_i18n_hash: 1eae5f5894f7cbf4de993993feab86a5
---
# Memperkenalkan

## Latar Belakang

Sebagai pembuat konten, kami sering mempublikasikan artikel kami di berbagai platform pihak ketiga. Namun, bagi kami yang serius dengan konten kami, publikasi hanyalah awal. Kami perlu terus memantau pembaca artikel kami seiring waktu. Sayangnya, kemampuan pengumpulan data kami terbatas pada apa yang ditawarkan oleh setiap platform, yang sangat bergantung pada kemampuan platform tersebut. Lebih dari itu, ketika kami mendistribusikan konten yang sama di berbagai platform, data pembaca dan kunjungan sepenuhnya terisolasi.

Sebagai seorang pengembang, saya membuat banyak aplikasi perangkat lunak. Namun, setelah saya merilis aplikasi-aplikasi tersebut, saya sering kehilangan kendali atasnya. Sebagai contoh, setelah merilis program baris perintah, saya tidak memiliki cara untuk mengetahui bagaimana pengguna berinteraksi dengannya atau bahkan berapa banyak pengguna yang menggunakan aplikasi saya. Demikian pula, ketika mengembangkan aplikasi sumber terbuka, dulu saya hanya bisa mengukur minat melalui bintang GitHub, yang membuat saya tidak mengetahui tentang penggunaan aktual.

Oleh karena itu, kita memerlukan solusi sederhana yang mengumpulkan informasi minimal, menghormati privasi pribadi dan batasan lainnya. Solusi ini adalah telemetri.

## Telemetri

Dalam bidang komputasi, telemetri adalah teknologi umum yang melibatkan pelaporan informasi secara minimal dan anonim untuk mengakomodasi kekhawatiran privasi sambil tetap memenuhi kebutuhan analitis dasar pembuat konten.

Sebagai contoh, kerangka kerja Next.js dari React mengumpulkan informasi menggunakan telemetri: [Referensi API: Next.js CLI | Next.js (nextjs.org)](https://nextjs.org/docs/app/api-reference/next-cli#telemetry)

Selain itu, dengan menanamkan gambar piksel transparan berukuran 1px dalam sebuah artikel, kita dapat mengumpulkan data pengunjung di situs web yang tidak kita miliki kontrolnya. Peramban modern dan sebagian besar situs web memblokir penyisipan skrip kustom karena risiko keamanan yang mungkin terjadi. Namun, gambar tampak jauh lebih tidak berbahaya. Hampir semua situs web memperbolehkan pemuatan gambar pihak ketiga, membuat telemetri menjadi mungkin.

## Informasi Apa yang Dapat Kita Kumpulkan Melalui Sebuah Gambar?

Secara mengejutkan, menerima satu permintaan gambar memungkinkan kita mengumpulkan informasi lebih dari yang mungkin Anda perkirakan.

Dengan menganalisis permintaan jaringan, kita dapat memperoleh alamat IP pengguna, waktu kunjungan, referrer, dan jenis perangkat. Ini memungkinkan kita untuk menganalisis pola lalu lintas, seperti waktu puncak pembaca, tren, distribusi demografis, dan granularitas lalu lintas di berbagai platform. Informasi ini sangat berharga untuk kegiatan pemasaran dan promosi.

![](/img/telemetry/1.png)

## Bagaimana Kita Dapat Menerapkan Telemetri?

Telemetri adalah teknologi yang sederhana, yang pada dasarnya memerlukan endpoint untuk menerima permintaan internet. Karena kesederhanaannya, hanya ada sedikit alat khusus untuk tujuan ini. Banyak orang mungkin tidak menganggap analitik penting, atau mereka mungkin terhalang oleh penghalang awal. Namun, permintaan untuk fungsi seperti ini jelas ada.

Mengembangkan solusi telemetri itu sederhana. Anda hanya perlu membuat proyek, mengatur rute, mengumpulkan informasi dari body permintaan, dan mengembalikan gambar kosong.

Berikut adalah contoh dengan menggunakan Node.js:

```jsx
router.get(
  '/telemetry.gif',
  async (req, res) => {
    const ip = req.ip;
    const referer = req.header['referer'];
    const userAgent = req.headers['user-agent'];

    // Simpan dalam basis data Anda

    const blankGifBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.header('Content-Type', 'image/gif').send(blankGifBuffer);
  }
);
```

Jika Anda lebih memilih untuk tidak mengembangkan solusi Anda sendiri, saya merekomendasikan Tianji. Sebagai proyek sumber terbuka yang menawarkan **Website Analytics**, **Uptime Monitoring**, dan **Server Status**, Tianji baru-baru ini memperkenalkan fitur telemetri untuk membantu pembuat konten dalam melaporkan telemetri, sehingga memfasilitasi pengumpulan data yang lebih baik. Yang terpenting, sebagai sumber terbuka berarti Anda memiliki kendali atas data Anda dan dapat menggabungkan lalu lintas dari berbagai platform di satu tempat, menghindari fragmentasi melihat informasi yang sama di lokasi yang berbeda.

![](/img/telemetry/2.png)

GitHub: [https://github.com/msgbyte/tianji](https://github.com/msgbyte/tianji)

Situs Resmi: [https://tianji.dev/](https://tianji.dev/)
