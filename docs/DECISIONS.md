# Keputusan Teknis

## 2026-11-13 — Mengadopsi fondasi OpenVPM

- **Keputusan:** Menggunakan kode OpenVPM sebagai fondasi awal PETORA, berdasarkan persetujuan pemilik proyek untuk mematuhi AGPL-3.0.
- **Sumber:** `https://github.com/evangauer/openvpm`, commit `19333f027c097172025902a3a9ba56baddea3bf7`.
- **Dampak:** Lisensi AGPL-3.0 upstream dipertahankan. Perubahan dan distribusi kode turunan harus mengikuti ketentuan lisensi tersebut; atribusi dan pemberitahuan lisensi upstream tidak boleh dihapus.
- **Status:** Fondasi sudah disalin. Rebranding dan adaptasi arsitektur untuk PETORA belum selesai.

## 2026-11-13 — Memakai stack dan pengelola paket fondasi

- **Keputusan:** Memulai dari monorepo pnpm/Turborepo upstream dengan Next.js App Router, TypeScript, PostgreSQL, Drizzle ORM, Vitest, dan Playwright.
- **Alasan:** Stack tersebut sesuai dengan spesifikasi teknis PETORA dan telah tersedia pada fondasi yang diadopsi.
- **Status:** Dependensi terpasang; type-check dan konfigurasi Compose berhasil diverifikasi. Beberapa tes baseline dan lint masih gagal, lihat `PROGRESS.md`.

## 2026-11-13 — Menambahkan konfigurasi ESLint

- **Keputusan:** Menggunakan ESLint 8 dan konfigurasi Next.js 15 untuk mengaktifkan skrip lint upstream yang sebelumnya tidak memiliki konfigurasi.
- **Alasan:** Skrip `next lint` sebelumnya meminta konfigurasi interaktif dan tidak dapat dijalankan secara otomatis.
- **Status:** Linter sekarang dapat dijalankan non-interaktif, tetapi melaporkan pelanggaran yang sudah ada pada kode upstream; belum dilakukan pembersihan menyeluruh.

## 2026-11-13 — Menerapkan branding dasar PETORA

- **Keputusan:** Mengganti identitas utama aplikasi, logo, dan fallback pelanggan menjadi PETORA INDONESIA; mempertahankan warna teal awal dari fondasi sebagai warna placeholder.
- **Alasan:** Menyelesaikan rebranding awal Fase 0 tanpa mengubah konfigurasi branding cabang yang dikelola pengguna.
- **Atribusi wajib:** Footer aplikasi dan seluruh PDF yang dihasilkan selalu menampilkan "Powered by PETORA INDONESIA".
- **Status:** Identitas utama, halaman autentikasi inti, portal, halaman booking/capture/persetujuan, footer staf, dan PDF diperbarui. Alur hosted/demo dan email pemasaran upstream belum diadaptasi.

## 2026-11-13 — Memakai `locations` sebagai model cabang PETORA

- **Keputusan:** Gunakan tabel `locations` yang sudah dimiliki `practices` sebagai representasi cabang; jangan membuat tabel `branches` paralel.
- **Alasan:** `locations` sudah menjadi induk untuk jadwal, ruang, janji temu, dan konfigurasi pesan per lokasi. Tabel kedua akan membuat identitas cabang dan foreign key tidak konsisten.
- **Batasan saat ini:** Keberadaan `location_id` pada sebagian modul belum berarti seluruh akses data sudah dibatasi per cabang. `users.locationId` saat ini hanya satu lokasi dan tidak menjadi aturan otorisasi cabang.
- **Integritas tenant-cabang:** Semua referensi lokasi yang berada pada tabel tenant harus memakai foreign key komposit `(practice_id, location_id)` ke `locations(practice_id, id)`. Migrasi melakukan preflight dan berhenti dengan pesan eksplisit bila menemukan referensi lintas-praktik; data lama tidak direwrite otomatis.
- **Scope appointment:** Assignment role custom tanpa `location_id` berlaku seluruh praktik; assignment bercabang membatasi daftar/detail/riwayat appointment dan sumber daya jadwal. Mutasi appointment memeriksa izin pada cabang dari input atau lokasi efektif appointment; reschedule memeriksa cabang asal dan tujuan. Pembatalan recurring series belum mendukung assignment cabang dan tetap ditolak untuk role cabang saja. Semua cabang tetap tenant-scoped oleh RLS.
- **Keputusan migrasi RBAC:** Pertahankan `users.role` dan enum lama sebagai kompatibilitas selama permission guard dipindahkan bertahap. Role kustom tidak boleh dipakai untuk memberi akses sampai pemeriksaan server benar-benar menggunakan permission dinamis.
- **Aturan delegasi:** Pemanggil hanya boleh memberi role permission yang dimiliki akunnya sendiri; akun admin legacy tidak boleh diberi assignment custom selama migrasi agar jalur pemulihan lama tetap tersedia.
- **Lokasi invoice:** Invoice baru dapat menyimpan lokasi cabang. Invoice dari appointment mengikuti lokasi appointment; invoice kasir dari UI mengirim cabang yang dipilih, dan assignment cabang divalidasi server-side. Migrasi 0120 hanya membackfill invoice yang appointment-nya berada pada praktik yang sama. Invoice historis tanpa appointment dibiarkan tanpa lokasi karena cabang asalnya tidak dapat disimpulkan dengan aman; saldo stok saat ini tetap praktik-wide.
- **Migrasi guard settings:** Endpoint pengelolaan lokasi, tipe appointment, dan ruang memakai `settings.manage` dengan fallback role admin legacy; permission ini tidak mencakup penghapusan akun, pengelolaan staf, atau aksi onboarding yang tetap admin-only. UI Settings menampilkan tab konfigurasi tersebut untuk pemegang permission praktik `settings.manage`, tab Staff untuk `staff.roles.manage`, dan mempertahankan tab lain khusus admin legacy.
- **Migrasi pencatatan vital:** `vitals.record` memakai `appointments.clinical.manage` dengan fallback admin, veterinarian, dan technician. Assignment cabang hanya mengotorisasi pencatatan yang tertaut ke appointment dengan lokasi efektif yang cocok; pencatatan tanpa appointment tidak memiliki konteks cabang dan tetap fail-closed untuk role cabang. Koreksi entered-in-error tetap dibatasi pada admin dan veterinarian.
- **Migrasi treatment plan pasien:** Pembuatan dan perubahan plan memakai `appointments.clinical.manage`, dengan fallback role admin, veterinarian, dan technician. Karena plan disimpan pada tingkat pasien tanpa lokasi cabang, assignment cabang tidak cukup untuk mengotorisasi mutasi; akses custom harus diberikan pada tingkat praktik.
- **Migrasi waitlist:** Penambahan dan perubahan status waitlist memakai `appointments.schedule.manage`, yang mempertahankan matriks admin, veterinarian, dan front desk. Waitlist belum menyimpan lokasi sehingga assignment cabang saja tidak mengotorisasi mutasi sampai skema dan alur waitlist mendukung scope cabang.
- **Migrasi whiteboard:** Perubahan status appointment memakai `appointments.operations.manage` dengan pemeriksaan lokasi efektif appointment/ruang. Izin cabang dicek ulang di dalam transaksi setelah appointment dikunci agar perpindahan cabang bersamaan tidak melewati pemeriksaan akses.
- **Migrasi inventaris:** `inventory.manage` mengatur item, stok, dan pemasok; `inventory.catalog.manage` mengatur pembuatan produk dan harga. Fallback meniru role lama secara tepat (termasuk pembatasan harga hanya untuk admin/front desk); perubahan harga memeriksa izin katalog pada server. UI memakai hasil izin server. Assignment cabang tidak memberi akses karena saldo stok dan katalog harga masih praktik-wide.
- **Migrasi care reminder:** `care_reminders.manage` mempertahankan akses legacy admin, veterinarian, technician, dan front desk khusus untuk reminder. Karena reminder pasien belum memiliki lokasi cabang, permission hanya berfungsi pada scope praktik; assignment cabang saja tidak mengotorisasi operasi lintas pasien.
- **Migrasi encounter:** Draft klinis dan finalisasi klinis memakai `appointments.clinical.manage`; resolusi follow-up memakai `appointments.operations.manage`. Izin cabang klinis dicek ulang setelah appointment dikunci. Resolusi kerja kunjungan dan penyelesaian kunjungan tetap memakai role guard karena mengandung aturan tambahan yang role-set-nya tidak terwakili secara tepat oleh permission tersebut.
- **Status:** Skema `staff_roles`, `staff_role_permissions`, dan `staff_role_assignments` dibackfill dari enum lama. `requirePermission`, katalog izin, endpoint CRUD role/assignment tenant-scoped, dan panel UI mendukung assignment seluruh praktik atau cabang. Guard controlled-substance dan operasi appointment telah dimigrasikan dengan kompatibilitas role legacy. Pembatasan cabang appointment sudah diterapkan pada sebagian besar jalur baca/tulis; guard lain serta enforcement cabang modul bisnis lainnya masih perlu dimigrasikan.
- **Migrasi izin obat terkendali:** Router dan akses halaman memakai `controlled_substances.manage`; fallback mempertahankan akses untuk admin dan dokter hewan legacy. UI memeriksa izin server-side agar role kustom dapat diotorisasi tanpa mengandalkan enum role di browser.

## Terbuka — Antrean pekerjaan dan deployment HTTPS

- Strategi antrean berbasis PostgreSQL dan konfigurasi HTTPS produksi belum diterapkan atau diputuskan untuk PETORA.
- Jangan menganggap integrasi deployment upstream sebagai keputusan produk PETORA. Catat pilihan sebelum implementasi.
