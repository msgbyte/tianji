---
sidebar_position: 0
_i18n_hash: 2279fcf53ed0422cb00d2f89e2a43ac7
---
# Gambaran Umum Feed

Feed adalah aliran peristiwa ringan untuk ruang kerja Anda. Ini membantu tim mengumpulkan peristiwa penting dari berbagai sistem ke dalam saluran, berkolaborasi seputar insiden, dan menjaga pemangku kepentingan tetap terinformasi.

## Konsep

- Saluran: Aliran logis untuk mengumpulkan dan mengorganisasi peristiwa. Setiap saluran dapat terhubung ke satu atau lebih target notifikasi dan dapat memilih untuk memerlukan tanda tangan webhook.
- Peristiwa: Catatan tunggal dengan nama, konten, tag, sumber, identitas pengirim, kepentingan dan beban opsional. Peristiwa dapat diarsipkan atau tidak diarsipkan.
- Status: Jenis khusus dari peristiwa berkelanjutan yang dapat dimasukkan atau diperbarui berulang kali oleh eventId yang stabil, dan diselesaikan ketika selesai.
- Integrasi: Adaptor webhook bawaan yang mengonversi beban pihak ketiga (misalnya GitHub, Stripe, Sentry, Tencent Cloud Alarm) menjadi peristiwa Feed.
- Notifikasi: Saluran dapat menghantarkan peristiwa ke pemberi notifikasi yang terkonfigurasi; frekuensi pengiriman dapat diatur oleh pengaturan saluran.

## Kasus Penggunaan Tipikal

- Aliran insiden produk dan infrastruktur di berbagai layanan
- Pemberitahuan penerapan dan peluncuran CI/CD
- Sinyal penagihan dan langganan
- Peringatan keamanan, pemantauan, dan kesalahan
