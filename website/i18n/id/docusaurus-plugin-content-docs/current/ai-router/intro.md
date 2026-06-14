---
sidebar_position: 1
_i18n_hash: be40481b428c406d4fdaf208c202a926
---
# Router AI

Router AI memberikan satu endpoint AI yang stabil untuk sekelompok Gerbang AI. Ini merutekan setiap permintaan melalui rute gerbang yang dikonfigurasi, menyebarkan lalu lintas berdasarkan bobot di dalam tier yang sama, dan kembali ke tingkat berikutnya saat terjadi kegagalan yang dapat dicoba ulang.

Gunakan ini ketika Anda menginginkan:

- Satu endpoint untuk aplikasi Anda, bukan mengkodekan satu penyedia AI.
- Pembagian lalu lintas berbobot di antara beberapa gerbang.
- Kembali dari penyedia utama ke penyedia cadangan selama gangguan atau batasan tarif.
- Jalur migrasi di mana Anda dapat memindahkan lalu lintas secara bertahap dengan mengubah bobot.

## Bagaimana hubungannya dengan Gerbang AI

Gerbang AI tetap menjadi unit yang menyimpan kredensial penyedia, URL dasar khusus, harga model, peringatan kuota, dan log gerbang. Router AI tidak menggantikannya.

Router AI hanya memutuskan rute gerbang mana yang harus menerima permintaan.

Alur runtime adalah:

1. Aplikasi Anda memanggil endpoint Router AI.
2. Router AI menemukan router berdasarkan ID ruang kerja dan ID router.
3. Router AI memilih rute gerbang yang memenuhi syarat dari tier pertama.
4. AI Gateway yang dipilih mengirim permintaan ke penyedia AI hulu.
5. Jika upaya berhasil, Router AI mengembalikan respons tersebut.
6. Jika upaya gagal dengan kesalahan yang dapat dicoba ulang, Router AI mencoba rute lain di tier yang sama, lalu tier berikutnya.

## Prasyarat

Sebelum menambahkan rute, buat setidaknya satu Gerbang AI dengan kunci API model yang tersimpan. Gerbang tanpa kunci yang tersimpan tidak ditampilkan dalam pemilih rute Router AI.

Permintaan runtime masih memerlukan kunci API Tianji:

- Untuk endpoint yang mendukung OpenAI, kirimkan `Authorization: Bearer <YOUR_TIANJI_API_KEY>`.
- Untuk endpoint Pesan Antropik, kirimkan `x-api-key: <YOUR_TIANJI_API_KEY>`.

Tianji memverifikasi kunci API pemanggil, lalu menggunakan kunci penyedia AI Gateway yang tersimpan untuk permintaan hulu.

## Membuat router

1. Buka **Router AI** di sidebar Tianji.
2. Klik **Tambahkan Router AI**.
3. Masukkan nama router.
4. Biarkan **Diaktifkan** jika router harus menerima lalu lintas runtime.
5. Simpan router.

Setelah router dibuat, buka tab **Rute** untuk mengonfigurasi tier dan rute gerbang.

## Tingkatan

Sebuah tier adalah tingkat fallback.

Permintaan selalu dimulai pada tier pertama. Jika terjadi kegagalan yang dapat dicoba ulang, Router AI terus mencoba rute yang memenuhi syarat dalam tier tersebut. Jika setiap rute yang memenuhi syarat dalam tier gagal, Router AI beralih ke tier berikutnya.

Gunakan beberapa tier saat Anda menginginkan urutan fallback yang ketat.

Contoh:

| Tier | Rute | Arti |
| --- | --- | --- |
| Tier 1 | OpenAI utama, OpenRouter utama | Lalu lintas produksi normal |
| Tier 2 | DeepSeek cadangan | Cadangan setelah penyedia utama gagal |
| Tier 3 | Model internal khusus | Fallback terakhir |

Geser tier untuk mengurutkannya kembali. Tier teratas dicoba terlebih dahulu.

## Bobot dalam satu tier

Rute dalam tier yang sama tidak memiliki urutan tetap. Mereka berbagi lalu lintas berdasarkan bobot.

Contoh:

| Rute | Bobot | Pangsa usaha pertama secara perkiraan |
| --- | ---: | ---: |
| Gerbang A | 80 | 80% |
| Gerbang B | 20 | 20% |

Ini berguna untuk:

- Pembagian lalu lintas acak di antara penyedia.
- Migrasi bertahap dari satu penyedia ke penyedia lain.
- Menguji coba gerbang baru dengan persentase kecil lalu lintas.

Jika Anda memerlukan urutan yang ketat, letakkan rute di tier yang berbeda alih-alih tier yang sama.

## Menambahkan rute gerbang

Pada tab **Rute**:

1. Klik **Tambahkan Gerbang** di dalam tier.
2. Pilih AI Gateway yang ada.
3. Pilih mode penyedia untuk rute ini.
4. Atur opsi rute.
5. Simpan.

Anda dapat mengedit atau menghapus rute nanti dari kartu rute.

### Penyedia

Penyedia mengontrol bagaimana Router AI memanggil AI Gateway yang dipilih untuk rute ini. AI Gateway yang sama dapat digunakan dalam rute yang berbeda dengan mode penyedia yang berbeda jika itu cocok dengan pengaturan Anda.

Nilai penyedia yang didukung:

- `openai`
- `deepseek`
- `anthropic`
- `openrouter`
- `custom`

Untuk `custom`, Router AI menggunakan pengaturan model khusus yang disimpan pada AI Gateway yang dipilih, seperti URL dasar khusus dan nama model khusus.

### Berat

Berat mengontrol bagaimana lalu lintas didistribusikan di antara rute dalam satu tier. Berat yang lebih tinggi berarti rute lebih mungkin dicoba terlebih dahulu.

Default: `100`.

### Model Override

Model Override bersifat opsional.

Jika diatur, Router AI menggantikan `model` permintaan dengan nilai ini sebelum mengirim permintaan ke rute gerbang yang dipilih. Biarkan kosong jika permintaan aplikasi yang harus menentukan model.

### Timeout

Timeout adalah waktu maksimum untuk satu upaya gerbang.

Default: `30000ms`.

Jika upaya melampaui waktu tunggu, Router AI menganggapnya dapat dicoba ulang dan dapat mencoba rute berikutnya yang memenuhi syarat.

### Kode Status yang Dapat Dicoba Ulang

Router AI selalu menganggap kesalahan jaringan, waktu habis, dan kode status ini dapat dicoba ulang:

- `429`
- `500`
- `502`
- `503`
- `504`

Gunakan **Kode Status yang Dapat Dicoba Ulang** untuk menambahkan lebih banyak kode status untuk sebuah rute. Sebagai contoh, Anda dapat menambahkan `408` jika penyedia sering melaporkan waktu tunggu permintaan sebagai respons HTTP.

Berhati-hatilah dengan kesalahan validasi seperti `400` atau `401`. Itu biasanya berarti permintaan atau kunci salah, dan mencoba ulang penyedia lain dapat menyembunyikan masalah yang sebenarnya.

## Log

Tab **Log** menunjukkan upaya runtime untuk sebuah router:

- Status: `Berhasil`, `Gagal`, atau `Sebagian`.
- Protokol: protokol permintaan yang cocok.
- Upaya: berapa banyak rute gerbang yang dicoba.
- Gerbang Akhir: gerbang yang menghasilkan hasil akhir.
- Log Gerbang Akhir: ID log AI Gateway yang terhubung.
- Durasi.

Gunakan log router untuk memahami perilaku failover. Gunakan log AI Gateway yang terhubung untuk memeriksa penggunaan token, detail model hulu, biaya, dan data respons penyedia.
