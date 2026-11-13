# Kemajuan PETORA INDONESIA

## Status saat ini

**Fase 1 — Arsitektur Multi-Cabang & RBAC Dinamis: fondasi RBAC dan migrasi guard bertahap; enforcement cabang operasional belum selesai.**

## Selesai

- Membaca panduan agent dan spesifikasi produk.
- Mengadopsi fondasi OpenVPM pada commit `19333f027c097172025902a3a9ba56baddea3bf7`; lisensi AGPL-3.0 dan atribusi upstream dipertahankan.
- Menyalin spesifikasi produk ke `docs/SPEC.md`.
- Mencatat keputusan teknis awal dan asumsi saat ini.
- Menyesuaikan petunjuk pengembangan dengan pnpm dan konfigurasi Compose yang tersedia.
- Memasang dependensi dari lockfile dan memvalidasi konfigurasi Docker Compose.
- Menambahkan konfigurasi ESLint agar pemeriksaan lint berjalan non-interaktif.
- Type-check seluruh workspace berhasil dengan heap Node 4 GB.
- Tes dokumentasi upstream yang terdampak pemindahan README berhasil setelah referensinya diarahkan ke arsip upstream (56 tes lulus).
- Menerapkan identitas PETORA pada aplikasi staf, autentikasi inti, portal pelanggan, dan aset logo/favicon.
- Menambahkan atribusi footer wajib pada aplikasi staf dan seluruh tipe PDF yang dihasilkan.
- Mengganti branding yang tampil pada alur onboarding, pengaturan, SMS, halaman legal/publik, notifikasi email, dan dokumentasi bantuan menjadi PETORA INDONESIA.
- Menghapus alamat kontak `.local` yang tidak dapat dihubungi; email dukungan opsional kini memakai `NEXT_PUBLIC_SUPPORT_EMAIL` / `EMAIL_SUPPORT_ADDRESS`.
- 122 tes branding, portal, autentikasi, email, dan PDF terpilih lulus; lint berkas yang diubah bersih dari error.
- Menambahkan skema role, permission, dan penugasan role per cabang; migrasi membackfill role lama dan mengaktifkan RLS untuk tabel baru.
- Menambahkan katalog permission dinamis, guard awal `requirePermission`, dan endpoint tenant-scoped untuk membuat, mengubah, menghapus role, serta melihat/mengelola assignment staf.
- Membatasi pendelegasian permission pada permission yang dimiliki pemanggil; role admin legacy tidak dapat dimasukkan ke mode custom role selama migrasi.
- Menambahkan panel role kustom pada tab Staff untuk role manager yang berwenang; assignment dari UI saat ini hanya practice-wide.
- Memigrasikan seluruh router controlled-substance ke `controlled_substances.manage`; hak legacy admin dan dokter hewan dipertahankan, dan akses UI/sidebar mengikuti permission server.
- Memigrasikan operasi mutasi appointment ke tiga permission granular (`appointments.schedule.manage`, `appointments.clinical.manage`, `appointments.operations.manage`) dengan matriks akses role legacy yang dipertahankan; endpoint admin-only tetap memakai guard admin.
- Membatasi pembacaan appointment, riwayat pasien, ruang, dokter, lokasi, dan slot berdasarkan cabang role kustom; pembuatan, kunjungan lapangan, reschedule, perubahan status, attach patient, dan penghapusan memeriksa permission cabang.
- Menambahkan composite foreign key yang memastikan lokasi pada staf, produk, konfigurasi pesan lokasi, dan suppression SMS berasal dari praktik yang sama; migrasi menolak data legacy lintas-praktik alih-alih mengubahnya diam-diam.
- Tes RBAC, migrasi, dan keselamatan pengelolaan staf terpilih lulus (159 tes pada 5 berkas); lint berkas RBAC/UI yang terfokus lulus.

## Berikutnya

- Migrasikan guard server lain dari role enum ke permission dinamis secara bertahap; masih ada 111 pemakaian `requireRole` pada 30 router.
- Lengkapi enforcement cabang pada pembatalan recurring series; operasi lainnya yang menunjuk appointment ID kini memeriksa lokasi efektif dan izin cabang.
- Terapkan filter cabang pada modul operasional lain dengan uji lintas-cabang; role assignment bercabang belum boleh dianggap sebagai isolasi data bisnis di modul yang belum dimigrasikan.
- Pindahkan saldo dan reorder point stok dari satu saldo produk praktik ke saldo per cabang/gudang; `products.stockQuantity` saat ini masih satu saldo bersama.
- Tambahkan `location_id` pada alur operasional yang belum memilikinya (termasuk waitlist, kasir, dan laporan) setelah skema stok dan kebijakan akses ditetapkan.
- Perluas UI assignment ke cabang setelah enforcement lintas-cabang siap dan diuji.
- Ganti URL deployment/demo dan domain pengirim email upstream setelah domain resmi PETORA tersedia.
- Validasi ulang kebijakan hukum, kontak, dan klaim layanan hosted untuk yurisdiksi/entitas PETORA sebelum dipublikasikan.
- Selesaikan pilihan antrean dan strategi deployment produksi sebelum mengimplementasikannya.

## Hasil validasi dan kendala

- `pnpm lint` berjalan, tetapi gagal pada banyak pelanggaran lint yang sudah ada di kode upstream.
- `pnpm type-check` berhasil dengan `NODE_OPTIONS=--max-old-space-size=4096`; tanpa batas heap lebih besar, proses awal kehabisan memori.
- Pemeriksaan type-check ulang setelah perubahan teks terakhir dihentikan lingkungan dengan exit code 143; pemeriksaan sukses sebelumnya mencakup perubahan tipe dan PDF.
- Suite penuh sebelum perbaikan referensi README: 5.085 tes lulus, 6 gagal, dan 89 dilewati. Lima kegagalan dokumentasi diarahkan ke arsip README upstream dan 56 tes terkait lulus; suite penuh belum diulang.
- `archive-preflight.test.ts` masih menunjukkan dua kegagalan/timeout pada validasi terisolasi; belum diubah karena tidak terkait rebranding.
- Tes dokumentasi bantuan lulus (26 tes). Tes aplikasi terpilih lulus (195 tes pada 13 berkas), termasuk pemeriksaan branding email, URL demo, halaman legal, dan UI pengaturan.
- Fondasi skema role dan migrasi lulus type-check paket database; tes migrasi, permission, router context, dan keselamatan staf terpilih lulus (159 tes). Type-check web terhenti oleh lingkungan dengan exit code 143, termasuk percobaan ulang.
- Middleware permission dinamis dipakai katalog dan pengelolaan role; router lain tetap memakai guard role legacy sampai dimigrasikan.
- Type-check ulang workspace terhenti oleh lingkungan dengan exit code 143; jalankan kembali dengan heap 4 GB sebelum menyatakan selesai.
- Konfigurasi Compose valid, tetapi aplikasi belum dijalankan melalui Docker Compose.
- Audit awal Fase 1: `locations` sudah menjadi entitas praktik untuk jadwal/ruang/janji, tetapi sebagian besar skema operasional belum memiliki cabang; user masih memakai satu `locationId` dan enum role statis.
- Pemeriksaan izin masih memakai `requireRole` legacy di 111 titik pada 30 router; role kustom hanya efektif pada endpoint yang sudah memakai permission guard.
- Tes migrasi controlled-substance dan permission terpilih lulus (60 tes pada 5 berkas); lint terarah router, helper, tes, halaman, dan sidebar lulus.
- Tes migrasi database terpilih lulus (78 tes); `db:generate` menyatakan skema dan migration journal sinkron. Type-check paket DB dihentikan lingkungan dengan exit code 143 pada percobaan ulang.
- Validasi appointment dan branch-scope terbaru lulus (106 tes pada 4 berkas) dan lint terarah tanpa error. Type-check web untuk perubahan terakhir belum berhasil dijalankan; percobaan sebelumnya dihentikan lingkungan dengan SIGTERM.
- Lint terarah untuk implementasi RBAC lulus. Lint halaman settings penuh masih menemukan dua error yang sudah ada di area lain halaman (`react/no-unescaped-entities`, `no-explicit-any`) dan satu warning hook dependency; tidak diubah karena di luar cakupan.
- Kesesuaian implementasi fondasi dengan aturan bisnis PETORA belum diaudit menyeluruh.
