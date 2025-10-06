---
sidebar_position: 1
_i18n_hash: 252240b2a37c8c4784462e75b56d5243
---
# Pengenalan

## Apa itu Tianji

Satu kalimat untuk merangkum:

**Tianji** = **Analitik Situs Web** + **Pemantau Uptime** + **Status Server**

### Mengapa dinamakan Tianji?

Tianji(天机, pelafalan Tiān Jī) dalam bahasa Tiongkok berarti **Kesempatan Surgawi** atau **Strategi**

Karakter 天 (Tiān) dan 机 (Jī) dapat diterjemahkan sebagai "langit" dan "mesin" atau "mekanisme". Ketika digabungkan, bisa merujuk pada rencana strategis atau kesempatan yang tampak diatur oleh kekuatan yang lebih tinggi atau kekuatan selestial.

## Motivasi

Selama pengamatan kami terhadap situs web, kami sering perlu menggunakan beberapa aplikasi bersama. Misalnya, kami memerlukan alat analisis seperti `GA`/`umami` untuk memeriksa pv/uv dan jumlah kunjungan ke setiap halaman, kami memerlukan pemantau uptime untuk memeriksa kualitas jaringan dan konektivitas server, dan kami memerlukan prometheus untuk mendapatkan status yang dilaporkan oleh server untuk memeriksa kualitas server. Selain itu, jika kami mengembangkan aplikasi yang memungkinkan penyebaran open source, kami sering memerlukan sistem telemetry untuk membantu kami mengumpulkan informasi paling sederhana tentang situasi penyebaran orang lain.

Saya berpikir alat-alat ini seharusnya melayani tujuan yang sama, jadi apakah ada aplikasi yang dapat mengintegrasikan kebutuhan umum ini dengan cara yang ringan? Setelah semua, sebagian besar waktu kami tidak memerlukan fungsi yang sangat profesional dan mendalam. Tapi untuk mencapai pemantauan yang komprehensif, saya perlu menginstal begitu banyak layanan.

Ada baiknya untuk mengkhususkan diri dalam satu hal, jika kita adalah ahli dalam kemampuan terkait kita memerlukan alat khusus semacam itu. Tetapi bagi sebagian besar pengguna yang hanya memiliki kebutuhan ringan, aplikasi **Semua-dalam-Satu** akan lebih nyaman dan mudah digunakan.

## Instalasi

Menginstal Tianji dengan Docker sangat sederhana. pastikan Anda sudah menginstal docker dan plugin docker-compose

lalu, jalankan perintah-perintah berikut di mana saja:

```bash
wget https://raw.githubusercontent.com/msgbyte/tianji/master/docker-compose.yml
docker compose up -d
```

> Akun default adalah **admin**/**admin**, harap segera ganti kata sandi.

## Komunitas

Bergabunglah dengan komunitas kami yang berkembang untuk terhubung dengan sesama pengguna, berbagi pengalaman, dan tetap diperbarui tentang fitur dan perkembangan terbaru. Berkolaborasi, ajukan pertanyaan, dan berkontribusi pada pertumbuhan komunitas Tianji.

- [GitHub](https://github.com/msgbyte/tianji)
- [Discord](https://discord.gg/8Vv47wAEej)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/tianji)
