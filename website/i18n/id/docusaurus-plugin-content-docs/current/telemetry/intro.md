---
sidebar_position: 1
_i18n_hash: c61b6c9968c295ffdfdc1a484f853504
---
# Memperkenalkan

## Latar Belakang

Sebagai pembuat konten, kami sering mempublikasikan artikel kami di berbagai platform pihak ketiga. Namun, bagi kami yang serius dengan konten kami, publikasi hanyalah permulaan. Kami perlu terus memantau pembaca artikel kami seiring waktu. Sayangnya, kemampuan pengumpulan data kami terbatas pada apa yang ditawarkan oleh setiap platform, yang sangat bergantung pada kemampuan platform itu sendiri. Selain itu, ketika kami mendistribusikan konten yang sama ke berbagai platform, data pembaca dan kunjungan benar-benar terpisah.

Sebagai pengembang, saya membuat banyak aplikasi perangkat lunak. Namun, setelah saya merilis aplikasi-aplikasi tersebut, saya sering kehilangan kontrol atasnya. Misalnya, setelah merilis program command-line, saya tidak memiliki cara untuk mengetahui bagaimana pengguna berinteraksi dengannya atau bahkan berapa banyak pengguna yang menggunakan aplikasi saya. Demikian pula, saat mengembangkan aplikasi open-source, di masa lalu, saya hanya bisa mengukur minat melalui bintang GitHub, membuat saya tidak tahu tentang penggunaan sebenarnya.

Oleh karena itu, kami memerlukan solusi sederhana yang mengumpulkan informasi minimal, menghormati privasi pribadi dan pembatasan lainnya. Solusi ini adalah telemetri.

## Telemetri

Dalam bidang komputasi, telemetri adalah teknologi umum yang melibatkan pelaporan informasi secara minimal dan anonim untuk mengakomodasi masalah privasi sambil tetap memenuhi kebutuhan analitik dasar pembuat konten.

Sebagai contoh, kerangka kerja Next.js dari React mengumpulkan informasi menggunakan telemetri: [Referensi API: CLI Next.js | Next.js (nextjs.org)](https://nextjs.org/docs/app/api-reference/next-cli#telemetry)

Sebagai alternatif, dengan menyematkan gambar piksel transparan 1px di dalam artikel, dimungkinkan untuk mengumpulkan data pengunjung di situs web yang tidak kami kendalikan. Peramban modern dan sebagian besar situs web memblokir penyisipan skrip khusus karena potensi risiko keamanan. Namun, gambar tampak jauh lebih tidak berbahaya dibandingkan. Hampir semua situs web memperbolehkan pemuatan gambar pihak ketiga, menjadikan telemetri mungkin dilakukan.

## Informasi Apa yang Bisa Kita Kumpulkan Melalui Gambar?

Mengejutkan bahwa menerima satu permintaan gambar memungkinkan kami mengumpulkan lebih banyak informasi daripada yang mungkin diharapkan.

Dengan menganalisis permintaan jaringan, kita dapat memperoleh alamat IP pengguna, waktu kunjungan, referer, dan jenis perangkat. Ini memungkinkan kita untuk menganalisis pola lalu lintas, seperti waktu puncak pembaca dan tren, distribusi demografis, dan keterincian lalu lintas di seluruh platform. Informasi ini sangat berharga untuk aktivitas pemasaran dan promosi.

![](/img/telemetry/1.png)

## Bagaimana Kita Dapat Menerapkan Telemetri?

Telemetri adalah teknologi sederhana yang pada dasarnya memerlukan endpoint untuk menerima permintaan internet. Karena kesederhanaannya, ada sedikit alat yang didedikasikan untuk tujuan ini. Banyak yang mungkin tidak menganggap analitik penting, atau mereka mungkin dihalangi oleh hambatan awal. Namun, permintaan untuk fungsi semacam ini jelas.

Mengembangkan solusi telemetri itu sederhana. Anda hanya perlu membuat proyek, menyiapkan rute, mengumpulkan informasi dari badan permintaan, dan mengembalikan gambar kosong.

Berikut adalah contoh menggunakan Node.js:

```jsx
router.get(
  '/telemetry.gif',
  async (req, res) => {
    const ip = req.ip;
    const referer = req.header['referer'];
    const userAgent = req.headers['user-agent'];
    
    // Simpan di database Anda
    
    const blankGifBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.header('Content-Type', 'image/gif').send(blankGifBuffer);
  }
);
```

Jika Anda lebih suka tidak mengembangkan solusi Anda sendiri, saya merekomendasikan Tianji. Sebagai proyek open-source yang menawarkan **Analitik Situs Web**, **Pemantauan Waktu Aktif**, dan **Status Server**, Tianji baru-baru ini memperkenalkan fitur telemetri untuk membantu pembuat konten melaporkan telemetri, sehingga memfasilitasi pengumpulan data yang lebih baik. Yang terpenting, sebagai proyek open-source berarti Anda memiliki kontrol atas data Anda dan dapat mengkonsolidasikan lalu lintas dari banyak platform di satu tempat, menghindari fragmentasi melihat informasi yang sama di lokasi yang berbeda.

![](/img/telemetry/2.png)

GitHub: [https://github.com/msgbyte/tianji](https://github.com/msgbyte/tianji)

Situs Resmi: [https://tianji.msgbyte.com/](https://tianji.msgbyte.com/)
