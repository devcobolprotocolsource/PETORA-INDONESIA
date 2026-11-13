# Asumsi

Belum ada asumsi perilaku bisnis yang dicatat. Aturan produk di `README.md` dan `docs/SPEC.md` tetap menjadi acuan; asumsi baru akan dicatat di sini sebelum atau saat implementasi terkait.

Pemilihan fondasi AGPL-3.0 adalah keputusan yang disetujui pemilik proyek, bukan asumsi agent.

## Fase 1 — model cabang dan akses staf

- `locations` adalah cabang usaha pada spesifikasi PETORA; data pelanggan dan hewan tetap dimiliki bersama dalam satu `practice`.
- Penugasan staf ke cabang harus menjadi data otorisasi terpisah dari `users.locationId`, yang dipakai sebagai lokasi default untuk sebagian alur penjadwalan.
- Role pada tingkat `practice` berlaku di semua cabang; penugasan yang menyebut cabang tertentu hanya berlaku pada cabang tersebut. Aturan ini masih harus ditegakkan di server sebelum diperlakukan sebagai kontrol akses aktif.
