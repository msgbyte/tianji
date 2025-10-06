---
sidebar_position: 2
_i18n_hash: 0ab5a3f0d3e61495d00a9489e9a3f806
---
# Monitor Push

Monitor Push adalah metode pemantauan di mana aplikasi Anda secara aktif mengirim sinyal heartbeat ke **Tianji** alih-alih Tianji memeriksa layanan Anda. Ini sangat berguna untuk memantau tugas latar belakang, cron job, atau layanan di balik firewall yang tidak dapat diakses secara langsung.

## Cara Kerja

1. **Tianji** menyediakan URL endpoint push unik untuk Anda
2. Aplikasi Anda mengirim permintaan HTTP POST ke endpoint ini secara berkala
3. Jika tidak ada heartbeat yang diterima dalam periode timeout yang dikonfigurasi, Tianji memicu peringatan

## Konfigurasi

Saat membuat Monitor Push, Anda perlu mengkonfigurasi:

- **Nama Monitor**: Nama deskriptif untuk monitor Anda
- **Timeout**: Waktu maksimum (dalam detik) untuk menunggu antara heartbeat sebelum menganggap layanan down
- **Interval yang Direkomendasikan**: Seberapa sering aplikasi Anda harus mengirim heartbeat (biasanya sama dengan timeout)

## Format Endpoint Push

```
POST https://tianji.example.com/api/push/{pushToken}
```

### Parameter Status

- **Status Normal**: Kirim tanpa parameter atau dengan `?status=up`
- **Status Down**: Kirim dengan `?status=down` untuk secara manual memicu peringatan
- **Pesan Kustom**: Tambahkan `&msg=your-message` untuk menyertakan informasi tambahan
- **Nilai Kustom**: Tambahkan `&value=123` untuk melacak nilai numerik

## Contoh

### Heartbeat Dasar (cURL)

```bash
# Kirim heartbeat setiap 60 detik
while true; do
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>"
  sleep 60
done
```

### JavaScript/Node.js

```javascript
// Kirim heartbeat setiap 60 detik
setInterval(async () => {
  try {
    await fetch('https://tianji.example.com/api/push/<your-push-token>', { 
      method: 'POST' 
    });
    console.log('Heartbeat successful');
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
  }
}, 60000);
```

### Python

```python
import requests
import time

def send_heartbeat():
    try:
        response = requests.post('https://tianji.example.com/api/push/<your-push-token>')
        print('Heartbeat successful')
    except Exception as e:
        print(f'Failed to send heartbeat: {e}')

# Kirim heartbeat setiap 60 detik
while True:
    send_heartbeat()
    time.sleep(60)
```

## Penggunaan

### 1. Cron Jobs

Memantau eksekusi tugas yang dijadwalkan:

```bash
#!/bin/bash
# your-cron-job.sh

# Logika pekerjaan yang sebenarnya disini
./run-backup.sh

# Kirim sinyal sukses
if [ $? -eq 0 ]; then
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=up&msg=backup-completed"
else
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=down&msg=backup-failed"
fi
```

### 2. Layanan Latar Belakang

Memantau proses latar belakang yang berjalan lama:

```python
import requests
import time
import threading

class ServiceMonitor:
    def __init__(self, push_url):
        self.push_url = push_url
        self.running = True
        
    def start_heartbeat(self):
        def heartbeat_loop():
            while self.running:
                try:
                    requests.post(self.push_url)
                    time.sleep(30)  # Kirim setiap 30 detik
                except Exception as e:
                    print(f"Heartbeat failed: {e}")
        
        thread = threading.Thread(target=heartbeat_loop)
        thread.daemon = True
        thread.start()

# Penggunaan
monitor = ServiceMonitor('https://tianji.example.com/api/push/<your-push-token>')
monitor.start_heartbeat()

# Logika layanan utama Anda disini
while True:
    # Lakukan pekerjaan Anda
    time.sleep(1)
```

### 3. Sinkronisasi Database

Memantau tugas sinkronisasi data:

```python
import requests
import schedule
import time

def sync_data():
    try:
        # Logika sinkronisasi data disini
        result = perform_data_sync()
        
        if result.success:
            requests.post(
                'https://tianji.example.com/api/push/<your-push-token>',
                params={'status': 'up', 'msg': f'synced-{result.records}-records'}
            )
        else:
            requests.post(
                'https://tianji.example.com/api/push/<your-push-token>',
                params={'status': 'down', 'msg': 'sync-failed'}
            )
    except Exception as e:
        requests.post(
            'https://tianji.example.com/api/push/<your-push-token>',
            params={'status': 'down', 'msg': f'error-{str(e)}'}
        )

# Jadwalkan untuk berjalan setiap jam
schedule.every().hour.do(sync_data)

while True:
    schedule.run_pending()
    time.sleep(1)
```

## Praktik Terbaik

1. **Atur Timeout yang Tepat**: Konfigurasi nilai timeout berdasarkan kebutuhan aplikasi Anda. Untuk tugas yang sering, gunakan timeout yang lebih pendek. Untuk pekerjaan berkala, gunakan timeout yang lebih lama.

2. **Tangani Kegagalan Jaringan**: Implementasikan logika retry dalam kode heartbeat Anda untuk menangani masalah jaringan sementara.

3. **Gunakan Pesan yang Bermakna**: Sertakan pesan deskriptif dengan heartbeat Anda untuk memberikan konteks saat meninjau log.

4. **Pemantauan Jalur Kritis**: Tempatkan panggilan heartbeat di titik-titik kritis dalam aliran aplikasi Anda, tidak hanya di awal.

5. **Penanganan Pengecualian**: Kirim status "down" saat terjadi pengecualian dalam aplikasi Anda.

## Pemecahan Masalah

### Masalah Umum

**Tidak ada heartbeat yang diterima**:
- Verifikasi token push benar
- Periksa konektivitas jaringan dari aplikasi Anda ke Tianji
- Pastikan aplikasi Anda benar-benar menjalankan kode heartbeat

**Peringatan salah yang sering**:
- Tingkatkan nilai timeout
- Periksa jika aplikasi Anda mengalami masalah kinerja
- Tinjau stabilitas jaringan antara aplikasi Anda dan Tianji

**Heartbeat hilang**:
- Tambahkan penanganan kesalahan dan pencatatan pada kode heartbeat Anda
- Pertimbangkan untuk mengimplementasikan logika retry untuk permintaan yang gagal
- Pantau penggunaan sumber daya aplikasi Anda

## Pertimbangan Keamanan

- Jaga agar token push Anda tetap aman dan jangan ungkapkan di repositori publik
- Gunakan endpoint HTTPS untuk mengenkripsi data saat transit
- Pertimbangkan untuk mengganti token push secara berkala
- Batasi frekuensi heartbeat untuk menghindari membebani instansi Tianji Anda

Monitor push menyediakan cara yang andal untuk memantau layanan yang tidak dapat dijangkau oleh pemantauan berbasis ping tradisional, menjadikannya alat esensial untuk pemantauan infrastruktur yang komprehensif. 
