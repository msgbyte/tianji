---
sidebar_position: 1
_i18n_hash: ce8b2ef04235ac36f0637772cc3b720a
---
# Menjalankan Reporter sebagai DaemonSet

Jika Anda menjalankan Tianji di dalam Kubernetes, Anda mungkin ingin mengumpulkan metrik sistem dari setiap node. Cara termudah adalah menjalankan `tianji-reporter` sebagai DaemonSet sehingga berjalan pada setiap node.

1. Edit `docker/k8s/reporter-daemonset.yaml` dan ganti nilai `TIANJI_SERVER_URL` dan `TIANJI_WORKSPACE_ID` dengan alamat server dan ID ruang kerja Anda yang sebenarnya.
2. Terapkan manifestnya:

```bash
kubectl apply -f docker/k8s/reporter-daemonset.yaml
```

Setiap node akan memulai sebuah kontainer `tianji-reporter` yang melaporkan statistik sistem ke instance Tianji Anda. Anda dapat memeriksa log dari pod tertentu untuk memastikan bahwa ini bekerja:

```bash
kubectl logs -l app=tianji-reporter -f
```

Setelah pod berjalan, halaman **Servers** di Tianji akan menampilkan node Kubernetes Anda seperti mesin biasa.
