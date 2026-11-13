# agent.md - Panduan Operasional Agent Pengembang PETORA INDONESIA

Dokumen ini adalah sumber kebenaran tunggal (Single Source of Truth) mengenai **bagaimana** Agent Pengembang harus bekerja, mengambil keputusan, dan mengeksekusi pengembangan PETORA INDONESIA dari awal hingga rilis. 

Dokumen ini saling melengkapi dengan `README.md` (spesifikasi produk) dan `docs/SPEC.md` (spesifikasi teknis rinci).

---

## 1. Mandat & Otoritas Agent

Agent memiliki **kontrol penuh dan otonomi tinggi** atas:
- **Keputusan Teknis**: Pemilihan library tambahan, struktur folder, pola arsitektur, optimasi database, dan strategi deployment, selama masih dalam koridor stack teknologi yang disepakati.
- **Keputusan Bisnis Operasional**: Mengisi celah spesifikasi dengan asumsi yang paling masuk akal untuk konteks bisnis *pet shop* dan klinik hewan di Indonesia (misal: format nomor HP +62, alur *grooming* khas lokal, struktur pajak UMKM), tanpa perlu menunggu konfirmasi, **selama** tidak melanggar "Aturan Bisnis Non-Negotiable" (Bagian 6).

**Batasan Otoritas**: 
Jika terjadi konflik antara keputusan Agent dan spesifikasi di `README.md` atau `docs/SPEC.md`, **spesifikasi produk selalu menang**. Agent wajib mencatat penyimpangan atau asumsi yang dibuat di `docs/ASSUMPTIONS.md`.

---

## 2. Prinsip Pengembangan Utama

1. **Self-Contained & Self-Hosted**: Sistem harus mudah dipasang oleh pemilik usaha non-teknis menggunakan Docker Compose. Tidak ada ketergantungan pada layanan SaaS pihak ketiga yang dikunci mati (hardcoded).
2. **Security by Default**: Enkripsi kredensial, Row-Level Security (RLS) atau scoping `branch_id` yang ketat, audit log untuk aksi sensitif, dan proteksi terhadap brute-force.
3. **Zero-Code Configuration**: Pemilik harus bisa mengubah pajak, template pesan, form rekam medis, dan hak akses dari UI, tanpa menyentuh kode atau database.
4. **Progressive Enhancement**: Aplikasi harus tetap fungsional dan informatif bahkan saat kondisi jaringan buruk atau saat fitur opsional (misal: komisi) dimatikan.
5. **Clean & Maintainable Code**: TypeScript strict mode, komponen UI yang reusable (shadcn/ui), dan pemisahan concern yang jelas antara logika bisnis, API, dan presentasi.

---

## 3. Strategi Adaptasi dari OpenVPM

Agent akan meng-clone `https://github.com/evangauer/openvpm.git` sebagai fondasi, lalu melakukan adaptasi strategis berikut:

| Aspek | OpenVPM (Asli) | PETORA INDONESIA (Adaptasi) |
| :--- | :--- | :--- |
| **Model Bisnis** | Multi-tenant SaaS (Banyak praktik independen) | Single-owner Multi-branch (Satu pemilik, banyak cabang) |
| **Mata Uang** | USD / Multi-currency | **Terkunci pada Rupiah (IDR)** |
| **Pembayaran** | Stripe | **Midtrans / Xendit** (QRIS, VA, E-wallet) + Split Payment |
| **Komunikasi** | Twilio / Resend (Default) | **WhatsApp** (Cloud API / Fonnte) sebagai prioritas + SMTP/Resend |
| **Layanan** | Klinik & Apotek | Klinik, **Grooming**, dan **Penitipan (Pet Hotel)** |
| **Stok** | Standar | Wajib **FEFO** (First Expired First Out) dengan batch tracking |
| **Rekam Medis** | Standar | Wajib **Berversi & Terkunci** (Addendum only) |

**Ketentuan lisensi fondasi:** OpenVPM menggunakan AGPL-3.0. PETORA mengadopsi fondasi ini dengan persetujuan pemilik proyek; pertahankan teks lisensi dan pemberitahuan hak cipta upstream, serta lisensikan kode turunan sesuai AGPL-3.0. Hak atas merek PETORA terpisah dari hak cipta kode upstream.

---

## 4. Peta Jalan Pengembangan (Fase Eksekusi)

Agent harus mengeksekusi pengembangan secara berurutan. Setiap fase harus diselesaikan, diuji, dan didokumentasikan sebelum melanjutkan ke fase berikutnya.

### **Fase 0: Inisialisasi & Fondasi**
- Clone repositori `openvpm` dan bersihkan aset/branding lama.
- Terapkan rebranding awal: nama "PETORA INDONESIA", placeholder logo, dan warna aksen.
- Setup lingkungan pengembangan: Docker Compose (PostgreSQL, MinIO/S3 lokal), Next.js 15, Drizzle ORM, Vitest, Playwright.
- Buat file `docs/DECISIONS.md` dan `docs/ASSUMPTIONS.md`.

### **Fase 1: Arsitektur Multi-Cabang & RBAC Dinamis**
- Modifikasi skema database: tambahkan tabel `branches` dan hubungkan entitas (stok, jadwal, kasir) dengan `branch_id`.
- Pastikan data `customers`, `pets`, `products`, dan `roles` bersifat global (shared) lintas cabang.
- Bangun sistem RBAC (Role-Based Access Control) yang dinamis: pemilik bisa membuat peran kustom, mengatur hak akses granular, dan batas nominal (misal: diskon maks 10%).

### **Fase 2: Modul Inti (Kasir, Stok, Pelanggan)**
- **Pelanggan & Hewan**: CRUD lengkap, deteksi duplikat, format nomor Indonesia.
- **Produk & Stok**: Implementasi wajib FEFO, batch tracking, stok opname, dan transfer antar cabang.
- **Kasir (POS) Terpadu**: Keranjang belanja yang bisa mencampur produk, obat, jasa grooming, dan tindakan klinik dalam **satu tagihan**.

### **Fase 3: Modul Layanan (Klinik, Grooming, Penitipan)**
- **Klinik**: Form rekam medis dinamis (bisa dikustomisasi pemilik), SOAP, vaksin, dan pengurangan stok obat otomatis.
- **Grooming**: Status workflow (Terjadwal → Check-in → Diproses → Selesai), upload foto sebelum/sesudah.
- **Penitipan**: Manajemen kandang/kamar, log harian, dan perhitungan biaya otomatis per malam/jam.

### **Fase 4: Keuangan, Komisi & Integrasi**
- **Keuangan**: Jurnal otomatis, laba/rugi per cabang, manajemen hutang/piutang.
- **Komisi**: Mesin hitung komisi opsional (berbasis omzet/laba, bertingkat) yang hanya menghasilkan laporan.
- **Integrasi**: 
  - Pembayaran: Midtrans/Xendit (webhook handler yang idempotent).
  - WhatsApp: Pengiriman struk, OTP, dan pengingat otomatis via template.

### **Fase 5: Aplikasi Pelanggan (PWA)**
- Bangun antarmuka mobile-first (PWA) yang bisa di-install.
- Fitur: Login OTP WhatsApp, riwayat hewan, booking layanan, pembayaran tagihan, dan notifikasi status.

### **Fase 6: Pengujian, Dokumentasi & Rilis**
- Jalankan suite pengujian otomatis (Vitest untuk unit, Playwright untuk E2E alur kritis).
- Pastikan semua panduan peran (Pemilik, Kasir, Dokter, Pelanggan) tersedia di `docs/`.
- Finalisasi `README.md` dengan bagian "Memulai Cepat" (satu perintah deploy).

---

## 5. Aturan Bisnis Non-Negotiable (Wajib Dipatuhi)

Agent **TIDAK BOLEH** melanggar aturan berikut dalam implementasi apa pun:
1. **Satu Kunjungan, Satu Tagihan**: Semua item (kasir, klinik, grooming, penitipan) harus bisa digabung dalam satu invoice dan satu struk.
2. **Mata Uang**: Hanya Rupiah (IDR). Tidak ada konfigurasi untuk mata uang lain.
3. **FEFO**: Stok yang lebih dulu kedaluwarsa harus otomatis terpilih saat dispensing atau penjualan.
4. **Imutabilitas Rekam Medis**: Catatan medis yang sudah dikunci (final) tidak boleh diubah. Koreksi hanya boleh melalui addendum berversi.
5. **Imutabilitas Transaksi**: Transaksi final tidak boleh diubah diam-diam. Koreksi wajib melalui proses void/refund/retur dengan alasan dan jejak audit.
6. **Branding**: Atribusi "Powered by PETORA INDONESIA" wajib ditampilkan di footer aplikasi dan dokumen cetak. Tidak boleh ada fitur untuk menyembunyikannya.
7. **Keamanan Webhook**: Status pembayaran dari Midtrans/Xendit harus diverifikasi tanda tangannya dan diproses secara idempotent (hanya berubah sekali).

---

## 6. Protokol Dokumentasi & Pelaporan

Agent WAJIB menjaga dokumen berikut tetap mutakhir secara otomatis selama pengembangan:
- **`PROGRESS.md`**: Status terkini, apa yang sedang dikerjakan, dan apa yang selesai.
- **`CHANGELOG.md`**: Catatan perubahan setiap kali ada commit signifikan atau rilis versi.
- **`docs/DECISIONS.md`**: Catatan keputusan arsitektur atau teknis (misal: "Mengapa memilih library X untuk PDF generation").
- **`docs/ASSUMPTIONS.md`**: Catatan asumsi bisnis yang diambil Agent untuk mengisi celah spesifikasi (misal: "Asumsi: Biaya penitipan dihitung per 24 jam mulai dari jam check-in").

---

## 7. Prosedur Penanganan Ambiguitas

Jika Agent menemukan celah, kontradiksi, atau ketidakterangan dalam spesifikasi:
1. **Analisis**: Cari solusi yang paling umum dan aman untuk bisnis *pet shop* di Indonesia.
2. **Catat**: Tulis asumsi tersebut di `docs/ASSUMPTIONS.md`.
3. **Eksekusi**: Lanjutkan pengembangan berdasarkan asumsi tersebut tanpa memblokir progres, kecuali jika keputusan tersebut mengubah cakupan fitur secara drastis atau melanggar Aturan Non-Negotiable. Dalam kasus ekstrem, Agent akan menandai area tersebut dengan komentar `// TODO: PETORA-ASSUMPTION: [penjelasan]` dalam kode.

---

## 8. Definisi "Selesai" (Definition of Done)

Sebuah fitur atau fase dianggap selesai oleh Agent jika:
- [ ] Kode ditulis dalam TypeScript strict dan lolos linting.
- [ ] Ada pengujian otomatis (unit atau E2E) untuk alur kritis fitur tersebut.
- [ ] Dokumentasi terkait (jika ada) telah diperbarui.
- [ ] Fitur tersebut dapat dijalankan dan diverifikasi secara lokal melalui Docker Compose tanpa error.
- [ ] Tidak ada pelanggaran terhadap Aturan Bisnis Non-Negotiable.

---
*Dokumen ini adalah kontrak kerja antara Pemilik Proyek dan Agent Pengembang. Agent diharapkan membaca, memahami, dan menjalankan mandat ini secara disiplin.*
