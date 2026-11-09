/**
 * SARGA mockup data layer.
 * Seed data is copied once into localStorage so edits survive a refresh.
 * This is a demo store, not a security boundary: production rules must live on a server.
 */
(function () {
  const STORAGE_KEY = 'sarga_db_v8';

  const seed = {
    organizations: [
      {
        id: 'org-graha',
        name: 'Komunitas Graha Indah',
        type: 'Komunitas',
        address: 'Jl. Melati No. 5, Sukamaju',
        contact: '0812-0000-0001',
        inviteCode: 'GRAHA2026',
        inviteExpires: '2026-12-31',
        status: 'Aktif',
        createdAt: '2025-01-12'
      },
      {
        id: 'org-rt05',
        name: 'RT 05 / RW 08 Sukamaju',
        type: 'RT/RW',
        address: 'Perumahan Sukamaju Blok A-E',
        contact: '0812-1111-0005',
        inviteCode: 'RT05-2026',
        inviteExpires: '2026-12-31',
        status: 'Aktif',
        createdAt: '2024-08-17'
      },
      {
        id: 'org-nusantara',
        name: 'PT Nusantara Digital',
        type: 'Kantor',
        address: 'Gedung Nusantara, Lantai 4',
        contact: '021-555-0199',
        inviteCode: 'NUSANTARA2026',
        inviteExpires: '2026-12-31',
        status: 'Aktif',
        createdAt: '2025-03-02'
      },
      {
        id: 'org-argo',
        name: 'Karawitan Argo Budoyo',
        type: 'Komunitas',
        address: 'Balai Warga Argo, Jl. Kenanga 12',
        contact: '0813-2222-0044',
        inviteCode: 'ARGO2026',
        inviteExpires: '2026-12-31',
        status: 'Nonaktif',
        createdAt: '2024-05-10'
      }
    ],

    users: [
      { id: 'u-bambang', name: 'Bambang Irawan', wa: '081298765432', password: 'rahasia123', address: 'Divisi B - No. 12', status: 'Aktif', platformAdmin: true, createdAt: '2025-02-01' },
      { id: 'u-sudirman', name: 'H. Sudirman Santoso', wa: '081200000001', password: 'rahasia123', address: 'Divisi A - No. 01', status: 'Aktif', platformAdmin: true, createdAt: '2025-01-12' },
      { id: 'u-siti', name: 'Siti Dewi', wa: '081200000002', password: 'rahasia123', address: 'Divisi C - No. 09', status: 'Aktif', createdAt: '2025-01-12' },
      { id: 'u-agus-pramono', name: 'Agus Pramono', wa: '081200000003', password: 'rahasia123', address: 'Sekretariat', status: 'Aktif', createdAt: '2025-01-12' },
      { id: 'u-ratna', name: 'Ratna Maryati', wa: '081311223344', password: 'rahasia123', address: 'Divisi C1 - No. 05', status: 'Aktif', createdAt: '2025-02-11' },
      { id: 'u-dimas', name: 'Dimas Prasetyo', wa: '081355667788', password: 'rahasia123', address: 'Divisi D2 - No. 07', status: 'Aktif', createdAt: '2025-02-11' },
      { id: 'u-hendro', name: 'Hendro Wibowo', wa: '081377889900', password: 'rahasia123', address: 'Divisi A4 - No. 18', status: 'Aktif', createdAt: '2025-02-11' },
      { id: 'u-budi', name: 'Budi Prakoso', wa: '081399001122', password: 'rahasia123', address: 'Divisi B2 - No. 08', status: 'Aktif', createdAt: '2025-03-04' },
      { id: 'u-joko', name: 'Joko Santoso', wa: '081344556677', password: 'rahasia123', address: 'Divisi C2 - No. 04', status: 'Aktif', createdAt: '2025-03-04' },
      { id: 'u-hendra', name: 'Hendra Wijaya', wa: '081366778899', password: 'rahasia123', address: 'Divisi B1 - No. 04', status: 'Aktif', createdAt: '2025-04-09' },
      {
        id: 'u-agus-setiawan',
        name: 'Agus Setiawan, S.T.',
        wa: '081388776655',
        password: 'rahasia123',
        address: 'Divisi E1 - No. 15',
        status: 'Menunggu Verifikasi',
        createdAt: '2026-11-08',
        documentType: 'KTP (Kartu Tanda Penduduk)',
        documentName: 'KTP_dan_Surat_Pengantar_Agus_Setiawan.svg',
        documentImage: 'img/sample-ktp.svg',
        documentNote: 'KTP domisili Divisi E1 dan surat pengantar pengurus divisi.'
      },
      {
        id: 'u-rian',
        name: 'Rian Hidayat',
        wa: '081200001111',
        password: 'rahasia123',
        address: 'Divisi F2 - No. 03',
        status: 'Ditolak',
        createdAt: '2026-10-30',
        rejectionReason: 'Dokumen keanggotaan tidak terbaca jelas. Silakan unggah ulang foto kartu identitas atau KTA yang jelas.',
        documentType: 'Kartu Tanda Anggota (KTA)',
        documentName: 'Kartu_Anggota_Rian_Hidayat.svg',
        documentImage: 'img/sample-kartu-anggota.svg',
        documentNote: 'Foto kartu anggota buram saat pertama diajukan.'
      },
      { id: 'u-dewi-rt', name: 'Dewi Lestari', wa: '081211112222', password: 'rahasia123', address: 'Blok A - No. 3', status: 'Aktif', createdAt: '2024-08-17' },
      { id: 'u-rudi-rt', name: 'Rudi Hartono', wa: '081233334444', password: 'rahasia123', address: 'Blok B - No. 6', status: 'Aktif', createdAt: '2024-08-17' },
      { id: 'u-sari-rt', name: 'Sari Wulandari', wa: '081255556666', password: 'rahasia123', address: 'Blok C - No. 2', status: 'Aktif', createdAt: '2025-05-20' },
      { id: 'u-bayu-rt', name: 'Bayu Saputra', wa: '081277778888', password: 'rahasia123', address: 'Blok D - No. 9', status: 'Aktif', createdAt: '2025-05-20' },
      { id: 'u-maya', name: 'Maya Putri', wa: '081299990000', password: 'rahasia123', address: 'Lantai 4 - Meja 12', status: 'Aktif', createdAt: '2025-03-02' },
      { id: 'u-fajar', name: 'Fajar Nugroho', wa: '081222223333', password: 'rahasia123', address: 'Lantai 3 - Meja 08', status: 'Aktif', createdAt: '2025-03-02' }
    ],

    memberships: [
      { id: 'm-1', orgId: 'org-graha', userId: 'u-sudirman', role: 'Pengurus', position: 'Ketua', status: 'Aktif', joinedAt: '2025-01-12' },
      { id: 'm-2', orgId: 'org-graha', userId: 'u-siti', role: 'Pengurus', position: 'Sekretaris', status: 'Aktif', joinedAt: '2025-01-12' },
      { id: 'm-3', orgId: 'org-graha', userId: 'u-agus-pramono', role: 'Pengurus', position: 'Bendahara', status: 'Aktif', joinedAt: '2025-01-12' },
      { id: 'm-4', orgId: 'org-graha', userId: 'u-bambang', role: 'Pengurus', position: 'Koordinator Divisi B', status: 'Aktif', joinedAt: '2025-02-01' },
      { id: 'm-5', orgId: 'org-graha', userId: 'u-ratna', role: 'Anggota', position: 'Anggota', status: 'Aktif', joinedAt: '2025-02-11' },
      { id: 'm-6', orgId: 'org-graha', userId: 'u-dimas', role: 'Anggota', position: 'Anggota', status: 'Aktif', joinedAt: '2025-02-11' },
      { id: 'm-7', orgId: 'org-graha', userId: 'u-hendro', role: 'Anggota', position: 'Anggota', status: 'Aktif', joinedAt: '2025-02-11' },
      { id: 'm-8', orgId: 'org-graha', userId: 'u-budi', role: 'Anggota', position: 'Anggota', status: 'Aktif', joinedAt: '2025-03-04' },
      { id: 'm-9', orgId: 'org-graha', userId: 'u-joko', role: 'Anggota', position: 'Anggota', status: 'Aktif', joinedAt: '2025-03-04' },
      { id: 'm-10', orgId: 'org-graha', userId: 'u-hendra', role: 'Anggota', position: 'Anggota', status: 'Aktif', joinedAt: '2025-04-09' },
      { id: 'm-11', orgId: 'org-graha', userId: 'u-agus-setiawan', role: 'Anggota', position: 'Anggota', status: 'Menunggu Verifikasi', joinedAt: '2026-11-08' },
      { id: 'm-12', orgId: 'org-rt05', userId: 'u-dewi-rt', role: 'Pengurus', position: 'Ketua', status: 'Aktif', joinedAt: '2024-08-17' },
      { id: 'm-13', orgId: 'org-rt05', userId: 'u-rudi-rt', role: 'Pengurus', position: 'Sekretaris', status: 'Aktif', joinedAt: '2024-08-17' },
      { id: 'm-14', orgId: 'org-rt05', userId: 'u-sari-rt', role: 'Anggota', position: 'Anggota', status: 'Aktif', joinedAt: '2025-05-20' },
      { id: 'm-15', orgId: 'org-rt05', userId: 'u-bayu-rt', role: 'Anggota', position: 'Anggota', status: 'Aktif', joinedAt: '2025-05-20' },
      { id: 'm-16', orgId: 'org-nusantara', userId: 'u-maya', role: 'Pengurus', position: 'Ketua', status: 'Aktif', joinedAt: '2025-03-02' },
      { id: 'm-17', orgId: 'org-nusantara', userId: 'u-fajar', role: 'Pengurus', position: 'Sekretaris', status: 'Aktif', joinedAt: '2025-03-02' },
      { id: 'm-18', orgId: 'org-nusantara', userId: 'u-bambang', role: 'Anggota', position: 'Anggota', status: 'Aktif', joinedAt: '2025-06-15' },
      { id: 'm-19', orgId: 'org-graha', userId: 'u-rian', role: 'Anggota', position: 'Anggota', status: 'Ditolak', joinedAt: '2026-10-30' }
    ],

    items: [
      {
        id: 'itm-1',
        code: 'ITM-001',
        orgId: 'org-graha',
        ownerId: 'u-hendro',
        name: 'Obeng elektrik presisi & mata obeng set',
        maxDays: 3,
        location: 'Divisi A4 - No. 18',
        status: 'Tersedia',
        description: 'Lengkap 24 mata obeng baja presisi dan koper aluminium asli. Cocok untuk memperbaiki engsel kacamata, laptop, dan mainan anak.',
        contents: ['1 unit pemutar baut elektrik baterai isi ulang', '24 mata obeng baja presisi berbagai ukuran', '1 kabel pengisi daya tipe C', '1 kotak aluminium pembungkus asli'],
        instructions: 'Pengambilan dan pengecekan fungsi putar dilakukan bersama pemilik. Pastikan mata obeng tidak ada yang tertinggal saat dikembalikan.',
        image: 'img/obeng.jpg'
      },
      {
        id: 'itm-2',
        code: 'ITM-002',
        orgId: 'org-graha',
        ownerId: 'u-ratna',
        name: 'Tangga aluminium teleskopik 3.8 meter',
        maxDays: 3,
        location: 'Divisi C1 - No. 05',
        status: 'Tersedia',
        description: 'Bahan aluminium kokoh dan dapat dilipat ringkas untuk dimasukkan ke bagasi mobil. Kunci engsel bekerja normal.',
        contents: ['1 unit tangga teleskopik 3.8 meter', '1 tas penyimpanan'],
        instructions: 'Bawa kendaraan yang cukup panjang. Pemilik akan menunjukkan cara melipat dan mengunci engsel.',
        image: 'img/tangga.jpg'
      },
      {
        id: 'itm-3',
        code: 'ITM-003',
        orgId: 'org-graha',
        ownerId: 'u-dimas',
        name: 'Tenda kubah 4 orang tahan air',
        maxDays: 5,
        location: 'Divisi D2 - No. 07',
        status: 'Dipinjam',
        description: 'Kondisi bersih dan selalu diangin-anginkan. Lengkap dengan pasak besi, tiang tenda cadangan, dan flysheet penahan hujan.',
        contents: ['1 tenda kubah 4 orang', '4 pasak besi', '2 tiang cadangan', '1 flysheet'],
        instructions: 'Kembalikan dalam keadaan kering dan terlipat rapi. Hubungi pemilik jika ada bagian yang rusak.',
        image: 'img/tenda.jpg'
      },
      {
        id: 'itm-4',
        code: 'ITM-004',
        orgId: 'org-graha',
        ownerId: 'u-hendro',
        name: 'Ketam kayu manual & mata pisau asah',
        maxDays: 3,
        location: 'Divisi A4 - No. 18',
        status: 'Tersedia',
        description: 'Alat serut kayu tradisional untuk menghaluskan kusen pintu dan meja kayu yang seret. Pisau tajam dan siap pakai.',
        contents: ['1 ketam kayu manual', '1 mata pisau cadangan', '1 batu asah kecil'],
        instructions: 'Gunakan sarung tangan saat mengganti mata pisau. Kembalikan dalam keadaan bersih.',
        image: 'img/ketam.jpg'
      },
      {
        id: 'itm-5',
        code: 'AST-001',
        orgId: 'org-graha',
        ownerId: null,
        name: 'Mesin pahat & bubut kayu serbaguna',
        maxDays: 2,
        location: 'Sekretariat organisasi',
        status: 'Dipinjam',
        description: 'Dapat dipinjam anggota untuk pembuatan kerajinan dan perbaikan perabot. Pengambilan di sekretariat organisasi.',
        contents: ['1 mesin bubut kayu', '1 set pahat', '1 kunci alat'],
        instructions: 'Wajib didampingi penanggung jawab aset saat pengambilan dan pengembalian.',
        image: 'img/bubut.jpg'
      },
      {
        id: 'itm-6',
        code: 'ITM-005',
        orgId: 'org-graha',
        ownerId: 'u-budi',
        name: 'Set palu, tang kombinasi & kunci pas lengkap',
        maxDays: 3,
        location: 'Divisi B2 - No. 08',
        status: 'Dipinjam',
        description: 'Satu kotak perkakas mekanik dengan berbagai ukuran kunci pas dan palu karet. Sedang dipinjam oleh anggota lain.',
        contents: ['1 kotak perkakas', '1 palu karet', '1 tang kombinasi', '8 kunci pas'],
        instructions: 'Periksa kelengkapan sebelum dibawa pulang.',
        image: 'img/perkakas.jpg'
      },
      {
        id: 'itm-7',
        code: 'ITM-006',
        orgId: 'org-graha',
        ownerId: 'u-bambang',
        name: 'Mesin pemotong rumput dorong Honda',
        maxDays: 3,
        location: 'Divisi B - No. 12',
        status: 'Tersedia',
        description: 'Mesin pemotong rumput dorong dengan pisau tajam dan tangki bahan bakar terisi setengah.',
        contents: ['1 mesin pemotong rumput', '1 kunci busi', '1 kantong penampung rumput'],
        instructions: 'Gunakan di area terbuka. Kembalikan dengan tangki kosong dan pisau bersih.',
        image: 'img/mower.jpg'
      },
      {
        id: 'itm-8',
        code: 'ITM-007',
        orgId: 'org-graha',
        ownerId: 'u-bambang',
        name: 'Bor listrik impact 13 mm',
        maxDays: 3,
        location: 'Divisi B - No. 12',
        status: 'Dipinjam',
        description: 'Bor impact 13 mm dengan mata bor beton dan kayu. Sedang dipinjam anggota lain.',
        contents: ['1 bor listrik impact', '1 set mata bor', '1 kunci chuck'],
        instructions: 'Gunakan kacamata pelindung. Kembalikan dalam keadaan bersih.',
        image: 'img/obeng.jpg'
      },
      {
        id: 'itm-9',
        code: 'AST-002',
        orgId: 'org-graha',
        ownerId: null,
        name: 'Tenda terop besi 4x6 meter (2 unit)',
        maxDays: 5,
        location: 'Gudang bersama',
        status: 'Dipinjam',
        description: 'Tenda terop besi untuk kegiatan organisasi. Disimpan di gudang bersama.',
        contents: ['2 unit rangka terop', '2 lembar terpal', '1 set tali dan pasak'],
        instructions: 'Pemasangan minimal oleh dua orang. Kembalikan setelah dikeringkan.',
        image: 'img/placeholder-item.svg'
      },
      {
        id: 'itm-10',
        code: 'ITM-008',
        orgId: 'org-nusantara',
        ownerId: 'u-maya',
        name: 'Proyektor portabel ruang rapat',
        maxDays: 2,
        location: 'Lantai 4 - Meja 12',
        status: 'Tersedia',
        description: 'Proyektor portabel untuk presentasi tim. Lengkap dengan kabel HDMI dan remote.',
        contents: ['1 proyektor', '1 kabel HDMI', '1 remote', '1 tas jinjing'],
        instructions: 'Kembalikan setelah presentasi selesai. Jangan mencabut kabel saat proyektor masih menyala.',
        image: 'img/projector.jpg'
      }
    ],

    loans: [
      { id: 'ln-1', orgId: 'org-graha', itemId: 'itm-3', ownerId: 'u-dimas', borrowerId: 'u-bambang', start: '2026-11-07', end: '2026-11-12', status: 'Aktif', purpose: 'Kemah keluarga akhir pekan.', createdAt: '2026-11-05' },
      { id: 'ln-2', orgId: 'org-graha', itemId: 'itm-2', ownerId: 'u-ratna', borrowerId: 'u-bambang', start: '2026-11-10', end: '2026-11-12', status: 'Menunggu', purpose: 'Mengecat plafon ruang tamu sebelum acara keluarga.', createdAt: '2026-11-08' },
      { id: 'ln-3', orgId: 'org-graha', itemId: 'itm-8', ownerId: 'u-bambang', borrowerId: 'u-budi', start: '2026-11-05', end: '2026-11-11', status: 'Aktif', purpose: 'Memasang rak dinding di ruang kerja.', createdAt: '2026-11-04' },
      { id: 'ln-4', orgId: 'org-graha', itemId: 'itm-7', ownerId: 'u-bambang', borrowerId: 'u-joko', start: '2026-11-12', end: '2026-11-14', status: 'Menunggu', purpose: 'Merapikan taman sebelum acara syukuran.', createdAt: '2026-11-08' },
      { id: 'ln-5', orgId: 'org-graha', itemId: 'itm-5', ownerId: null, borrowerId: 'u-hendra', start: '2026-11-05', end: '2026-11-09', status: 'Aktif', purpose: 'Membuat kerajinan kayu untuk kegiatan organisasi.', createdAt: '2026-11-03' },
      { id: 'ln-6', orgId: 'org-graha', itemId: 'itm-4', ownerId: 'u-hendro', borrowerId: 'u-bambang', start: '2026-10-03', end: '2026-10-05', status: 'Selesai', purpose: 'Menghaluskan kusen pintu.', createdAt: '2026-10-01', completedAt: '2026-10-05T16:30:00+07:00' },
      { id: 'ln-7', orgId: 'org-graha', itemId: 'itm-3', ownerId: 'u-dimas', borrowerId: 'u-bambang', start: '2026-10-14', end: '2026-10-18', status: 'Selesai', purpose: 'Kemah akhir pekan.', createdAt: '2026-10-10', completedAt: '2026-10-18T17:15:00+07:00' },
      { id: 'ln-8', orgId: 'org-graha', itemId: 'itm-6', ownerId: 'u-budi', borrowerId: 'u-hendra', start: '2026-11-06', end: '2026-11-10', status: 'Aktif', purpose: 'Memperbaiki pagar rumah.', createdAt: '2026-11-05' },
      { id: 'ln-9', orgId: 'org-graha', itemId: 'itm-9', ownerId: null, borrowerId: 'u-hendra', start: '2026-11-01', end: '2026-11-06', status: 'Aktif', purpose: 'Acara syukuran divisi B.', createdAt: '2026-10-30' }
    ],

    announcements: [
      {
        id: 'an-1',
        orgId: 'org-graha',
        title: 'Pengecekan alat bersama',
        body: 'Sabtu, 15 November 2026 pukul 09.00 di sekretariat. Mohon bawa alat yang sedang dipinjam untuk dicek bersama.',
        authorId: 'u-sudirman',
        createdAt: '2026-11-06'
      },
      {
        id: 'an-2',
        orgId: 'org-graha',
        title: 'Pengembalian saat hari libur',
        body: 'Pengembalian yang jatuh tempo pada hari libur dapat dikembalikan pada hari kerja berikutnya tanpa dikenakan keterlambatan.',
        authorId: 'u-siti',
        createdAt: '2026-10-28'
      },
      {
        id: 'an-3',
        orgId: 'org-rt05',
        title: 'Kerja bakti bulanan',
        body: 'Kerja bakti lingkungan akan dilaksanakan Minggu, 16 November 2026 pukul 07.00 di balai warga.',
        authorId: 'u-dewi-rt',
        createdAt: '2026-11-02'
      }
    ],

    auditLogs: [
      { id: 'au-1', orgId: 'org-graha', actorId: 'u-sudirman', action: 'Meninjau pendaftaran anggota', target: 'Agus Setiawan, S.T.', note: 'Dokumen diterima, menunggu pemeriksaan lanjutan.', createdAt: '2026-11-08T10:15:00+07:00' },
      { id: 'au-2', orgId: 'org-graha', actorId: 'u-dimas', action: 'Menyetujui pinjaman', target: 'Tenda kubah 4 orang tahan air', note: 'Disetujui untuk Bambang Irawan.', loanId: 'ln-1', createdAt: '2026-11-05T15:20:00+07:00' },
      { id: 'au-3', orgId: 'org-graha', actorId: 'u-bambang', action: 'Menambahkan barang', target: 'Mesin pemotong rumput dorong Honda', note: 'Barang tayang di katalog.', createdAt: '2026-11-07T16:20:00+07:00' },
      { id: 'au-4', orgId: 'org-graha', actorId: 'u-siti', action: 'Mengirim pengumuman', target: 'Pengecekan alat bersama', note: 'Dikirim ke seluruh anggota.', createdAt: '2026-11-06T08:05:00+07:00' },
      { id: 'au-5', orgId: 'org-graha', actorId: 'u-sudirman', action: 'Mengubah bagan organisasi', target: 'Komunitas Graha Indah', note: 'Posisi Koordinator Divisi B ditetapkan.', createdAt: '2026-11-02T13:30:00+07:00' },
      { id: 'au-6', orgId: 'org-graha', actorId: 'u-hendra', action: 'Mengajukan pinjaman', target: 'Tenda terop besi 4x6 meter (2 unit)', note: 'Pengajuan untuk kegiatan syukuran divisi.', loanId: 'ln-9', createdAt: '2026-10-30T14:10:00+07:00' }
    ]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.organizations)) return parsed;
      }
    } catch (error) {
      console.warn('Data demo tidak bisa dibaca, memakai seed baru.', error);
    }
    return clone(seed);
  }

  let db = load();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (error) {
      console.warn('Perubahan tidak bisa disimpan di peramban ini.', error);
    }
  }

  function nextId(prefix) {
    const stamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `${prefix}-${stamp}${random}`;
  }

  function addAudit(entry) {
    db.auditLogs.unshift({
      id: nextId('au'),
      createdAt: new Date().toISOString(),
      ...entry
    });
  }

  const api = {
    get db() {
      return db;
    },
    seed: clone(seed),
    persist,
    reset() {
      db = clone(seed);
      persist();
    },
    nextId,
    addAudit,
    orgById(id) {
      return db.organizations.find((org) => org.id === id);
    },
    userById(id) {
      return db.users.find((user) => user.id === id);
    },
    membership(userId, orgId) {
      return db.memberships.find((m) => m.userId === userId && m.orgId === orgId);
    },
    membershipsOfUser(userId) {
      return db.memberships.filter((m) => m.userId === userId);
    },
    membersOf(orgId) {
      return db.memberships.filter((m) => m.orgId === orgId);
    },
    activeMembersOf(orgId) {
      return db.memberships.filter((m) => m.orgId === orgId && m.status === 'Aktif');
    },
    itemsOf(orgId) {
      return db.items.filter((item) => item.orgId === orgId);
    },
    itemById(id) {
      return db.items.find((item) => item.id === id);
    },
    itemsByOwner(ownerId) {
      return db.items.filter((item) => item.ownerId === ownerId);
    },
    loansOfBorrower(userId) {
      return db.loans.filter((loan) => loan.borrowerId === userId);
    },
    loansOfOwner(userId) {
      return db.loans.filter((loan) => loan.ownerId === userId);
    },
    loansOfItem(itemId) {
      return db.loans.filter((loan) => loan.itemId === itemId);
    },
    loanById(id) {
      return db.loans.find((loan) => loan.id === id);
    },
    announcementsOf(orgId) {
      return db.announcements.filter((item) => item.orgId === orgId);
    },
    auditOf(orgId) {
      return db.auditLogs.filter((entry) => entry.orgId === orgId);
    },
    orgByInvite(code) {
      const normalized = String(code || '').trim().toUpperCase();
      if (!normalized) return null;
      const today = new Date().toISOString().slice(0, 10);
      return db.organizations.find((org) =>
        org.inviteCode.toUpperCase() === normalized &&
        org.status === 'Aktif' &&
        (!org.inviteExpires || org.inviteExpires >= today)
      );
    },
    userByWa(wa) {
      const normalized = String(wa || '').replace(/\D/g, '');
      return db.users.find((user) => user.wa.replace(/\D/g, '') === normalized);
    }
  };

  window.SARGA_DB = api;
})();
