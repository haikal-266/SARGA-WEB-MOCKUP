/**
 * Click action handlers. Every mutation writes through data.js, then the screen re-renders.
 * Loaded after app.js and forms.js; helpers resolve when an action runs.
 */

function findMembership(id) {
  return store.db.memberships.find((membership) => membership.id === id) || null;
}

function audit(action, target, note, orgId, loanId) {
  const user = currentUser();
  const org = orgId || (currentOrg() ? currentOrg().id : '');
  if (!org) return;
  store.addAudit({
    orgId: org,
    actorId: user ? user.id : null,
    action,
    target,
    note,
    loanId
  });
}

function clipboardWrite(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', 'readonly');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  try {
    document.execCommand('copy');
  } catch (error) {
    console.warn('Kode undangan tidak bisa disalin otomatis.', error);
  }
  field.remove();
}

function handleAction(action, data, event) {
  if (!action) return;

  if (action === 'skip-main') {
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
      main.scrollIntoView({ block: 'start' });
    }
    return;
  }

  if (action === 'logout') {
    session = { userId: null, orgId: null };
    saveSession();
    closeModal();
    closeMobileMenu();
    toast('Anda sudah keluar', 'Pilih akun demo atau masuk kembali kapan saja.', 'info');
    navigate('#/login');
    return;
  }

  if (action === 'login-as') {
    const user = store.userById(data.user);
    if (!user) {
      toast('Akun demo tidak ditemukan', 'Pilih akun lain dari panel Data demo.', 'danger');
      return;
    }
    signIn(user);
    closeModal();
    closeMobileMenu();
    const membership = currentMembership();
    const org = currentOrg();
    toast('Masuk sebagai akun demo', `${user.name}${org ? ' · ' + org.name : ''}${membership ? ' · ' + membership.role : ''}.`, 'success');
    navigate(user.status === 'Aktif' && hasActiveMembership() ? '#/beranda' : '#/status-akun');
    return;
  }

  if (action === 'demo-pending' || action === 'demo-rejected') {
    const target = action === 'demo-pending' ? 'u-agus-setiawan' : 'u-rian';
    const user = store.userById(target);
    if (!user) {
      toast('Akun demo tidak tersedia', 'Data demo mungkin sudah direset.', 'danger');
      return;
    }
    session = { userId: user.id, orgId: 'org-graha' };
    saveSession();
    toast(action === 'demo-pending' ? 'Akun menunggu verifikasi' : 'Akun ditolak', `Masuk sebagai ${user.name}. Status akun bisa dilihat di halaman status.`, 'info');
    navigate('#/status-akun');
    return;
  }

  if (action === 'switch-user') {
    const userId = data.user;
    const orgId = data.org || primaryOrgId(userId);
    session = { userId, orgId };
    saveSession();
    render();
    return;
  }

  if (action === 'demo-admin') {
    const user = store.userById('u-sudirman');
    if (!user) {
      toast('Akun admin tidak tersedia', 'Data demo mungkin sudah direset.', 'danger');
      return;
    }
    session = { userId: user.id, orgId: 'org-graha' };
    saveSession();
    toast('Masuk sebagai pengurus', `${user.name} · Pengurus Komunitas Graha Indah.`, 'success');
    navigate('#/admin-monitoring');
    return;
  }

  if (action === 'reset-demo') {
    store.reset();
    session = { userId: 'u-bambang', orgId: 'org-graha' };
    saveSession();
    closeModal();
    catalogState = { query: '' };
    loanTab = 'Semua';
    memberStatusFilter = 'Semua';
    memberQuery = '';
    adminLoanQuery = '';
    directoryQuery = '';
    toast('Data demo direset', 'Semua perubahan di peramban ini dikembalikan ke data awal.', 'success');
    navigate('#/beranda');
    closeModal();
    render();
    return;
  }

  if (action === 'open-otp') {
    openOtpModal();
    return;
  }

  if (action === 'forgot-password') {
    openModal('Lupa kata sandi', `
      <div class="modal-body">
        <p class="small">Pada sistem nyata, tautan pengaturan ulang dikirim ke nomor WhatsApp terdaftar atau diperiksa pengurus organisasi.</p>
        <div class="well" style="margin-top:.9rem">
          <p class="small strong">Untuk demo ini</p>
          <p class="small muted" style="margin-top:.25rem">Semua akun demo memakai kata sandi <span class="mono">rahasia123</span>. Akun yang ditambahkan pengurus memakai <span class="mono">sarga123</span>.</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" type="button" data-action="close-modal">Tutup</button>
        <a class="btn-primary" href="#/login" data-action="close-modal">Kembali ke masuk</a>
      </div>`);
    return;
  }

  if (action === 'close-modal') {
    closeModal();
    return;
  }

  if (action === 'view-member-doc') {
    openMemberDocModal(data.id);
    return;
  }

  if (action === 'view-my-doc') {
    openMyDocModal();
    return;
  }

  if (action === 'quick-invite') {
    const inviteInput = document.getElementById('reg-invite');
    if (inviteInput) {
      inviteInput.value = data.code || '';
      inviteInput.dispatchEvent(new Event('input', { bubbles: true }));
      const nameInput = document.getElementById('reg-name');
      if (nameInput) nameInput.focus();
    }
    return;
  }

  if (action === 'use-sample-ktp') {
    const isJoin = !!document.getElementById('join-doc-preview-img');
    const prefix = isJoin ? 'join-' : 'reg-';
    const dataInput = document.getElementById(prefix + 'document-data');
    const nameInput = document.getElementById(prefix + 'document-name');
    const previewImg = document.getElementById(prefix + 'doc-preview-img');
    const filenameDisplay = document.getElementById(prefix + 'doc-filename-display');
    const typeSelect = document.getElementById(prefix + 'doc-type');
    const statusTag = document.getElementById(prefix + 'doc-status-tag');
    if (dataInput) dataInput.value = 'img/sample-ktp.svg';
    if (nameInput) nameInput.value = 'KTP_Agus_Setiawan_Demo.svg';
    if (previewImg) previewImg.src = 'img/sample-ktp.svg';
    if (filenameDisplay) filenameDisplay.textContent = 'Berkas: KTP_Agus_Setiawan_Demo.svg (Contoh KTP Demo)';
    if (typeSelect) typeSelect.value = 'KTP (Kartu Tanda Penduduk)';
    if (statusTag) {
      statusTag.textContent = 'KTP Demo Dipilih';
      statusTag.className = 'tag tag-in';
    }
    toast('KTP Demo Terpilih', 'Contoh KTP siap dikirim sebagai dokumen verifikasi.', 'info');
    return;
  }

  if (action === 'use-sample-kta') {
    const isJoin = !!document.getElementById('join-doc-preview-img');
    const prefix = isJoin ? 'join-' : 'reg-';
    const dataInput = document.getElementById(prefix + 'document-data');
    const nameInput = document.getElementById(prefix + 'document-name');
    const previewImg = document.getElementById(prefix + 'doc-preview-img');
    const filenameDisplay = document.getElementById(prefix + 'doc-filename-display');
    const typeSelect = document.getElementById(prefix + 'doc-type');
    const statusTag = document.getElementById(prefix + 'doc-status-tag');
    if (dataInput) dataInput.value = 'img/sample-kartu-anggota.svg';
    if (nameInput) nameInput.value = 'Kartu_Anggota_KGI_Demo.svg';
    if (previewImg) previewImg.src = 'img/sample-kartu-anggota.svg';
    if (filenameDisplay) filenameDisplay.textContent = 'Berkas: Kartu_Anggota_KGI_Demo.svg (Contoh KTA Demo)';
    if (typeSelect) typeSelect.value = 'Kartu Tanda Anggota (KTA)';
    if (statusTag) {
      statusTag.textContent = 'KTA Demo Dipilih';
      statusTag.className = 'tag tag-in';
    }
    toast('KTA Demo Terpilih', 'Contoh Kartu Anggota siap dikirim sebagai dokumen verifikasi.', 'info');
    return;
  }

  if (action === 'view-membership-doc') {
    openMemberDocModal(data.id);
    return;
  }

  if (action === 'open-join-modal') {
    const orgId = data.org;
    const invite = data.code || '';
    if (orgId) openJoinOrgModal(orgId, invite);
    return;
  }

  if (action === 'copy-invite') {
    const code = data.code || (currentOrg() ? currentOrg().inviteCode : '');
    if (!code) return;
    clipboardWrite(code);
    toast('Kode disalin', `Kode ${code} siap dibagikan ke calon anggota.`, 'success');
    return;
  }

  if (action === 'regenerate-invite') {
    const org = currentOrg();
    if (!org || !isOrgAdmin()) return;
    const next = uniqueInvite(`${suggestInvite(org.name)}`);
    org.inviteCode = next;
    audit('Mengganti kode undangan', org.name, `Kode baru ${next}.`);
    store.persist();
    toast('Kode undangan diganti', `Kode lama tidak berlaku lagi. Kode baru: ${next}.`, 'success');
    render();
    return;
  }

  if (action === 'open-org') {
    const orgId = data.org;
    const user = currentUser();
    if (!user || !orgId) return;
    const membership = store.membership(user.id, orgId);
    if (!membership) {
      toast('Bukan anggota', 'Akun ini tidak terdaftar di organisasi tersebut.', 'danger');
      return;
    }
    if (membership.status !== 'Aktif') {
      session = { userId: user.id, orgId };
      saveSession();
      toast('Keanggotaan belum aktif', 'Tunggu persetujuan pengurus organisasi.', 'info');
      navigate('#/status-akun');
      return;
    }
    session = { userId: user.id, orgId };
    saveSession();
    const org = store.orgById(orgId);
    toast('Organisasi dibuka', org ? org.name : 'Organisasi aktif.', 'success');
    navigate('#/beranda');
    return;
  }

  if (action === 'manage-org') {
    const orgId = data.org;
    const user = currentUser();
    if (!user || !orgId) return;
    const membership = store.membership(user.id, orgId);
    if (!membership || membership.status !== 'Aktif' || (membership.role !== 'Pengurus' && membership.role !== 'Org Admin')) {
      toast('Akses ditolak', 'Hanya Pengurus yang bisa membuka pengaturan organisasi.', 'danger');
      return;
    }
    session = { userId: user.id, orgId };
    saveSession();
    navigate('#/admin-organisasi');
    return;
  }

  if (action === 'approve-member') {
    if (!isOrgAdmin()) return;
    const membership = findMembership(data.id);
    if (!membership || membership.orgId !== (currentOrg() ? currentOrg().id : '')) return;
    if (membership.status === 'Aktif') {
      toast('Sudah aktif', 'Keanggotaan ini tidak perlu disetujui lagi.', 'info');
      return;
    }
    membership.status = 'Aktif';
    const user = store.userById(membership.userId);
    if (user) {
      user.status = 'Aktif';
      delete user.rejectionReason;
    }
    audit('Memverifikasi anggota', userName(membership.userId), 'Pendaftaran disetujui pengurus.', membership.orgId);
    store.persist();
    toast('Anggota disetujui', `${userName(membership.userId)} sekarang bisa meminjam dan menayangkan alat.`, 'success');
    render();
    return;
  }

  if (action === 'reject-member') {
    if (!isOrgAdmin()) return;
    openRejectMemberModal(data.id);
    return;
  }

  if (action === 'resubmit-member') {
    const membership = findMembership(data.id);
    if (!membership) return;
    const user = store.userById(membership.userId);
    membership.status = 'Menunggu Verifikasi';
    if (user) {
      user.status = 'Menunggu Verifikasi';
      delete user.rejectionReason;
    }
    audit('Mengajukan ulang keanggotaan', userName(membership.userId), 'Pemohon mengirim ulang pendaftaran.', membership.orgId);
    store.persist();
    toast('Pengajuan ulang terkirim', 'Pengurus akan memeriksa kembali pendaftaran Anda.', 'success');
    render();
    return;
  }

  if (action === 'approve-loan') {
    const loan = store.loanById(data.id);
    if (!loan) return;
    const user = currentUser();
    const allowed = isOrgAdmin() || (!!user && loan.ownerId === user.id);
    if (!allowed) {
      toast('Akses ditolak', 'Hanya pemilik barang atau pengurus yang bisa menyetujui.', 'danger');
      return;
    }
    if (loan.status !== 'Menunggu') {
      toast('Sudah diproses', 'Pengajuan ini sudah tidak menunggu keputusan.', 'info');
      return;
    }
    const item = store.itemById(loan.itemId);
    if (!item) return;
    if (item.status === 'Diarsipkan') {
      toast('Barang tidak tayang', 'Tayangkan kembali barang sebelum menyetujui pinjaman.', 'danger');
      return;
    }
    if (item.status === 'Dipinjam' && item.id !== loan.itemId) {
      toast('Barang sedang dipinjam', 'Selesaikan pinjaman berjalan terlebih dahulu.', 'danger');
      return;
    }
    loan.status = 'Aktif';
    item.status = 'Dipinjam';
    audit('Menyetujui pinjaman', item.name, `Disetujui untuk ${userName(loan.borrowerId)}.`, loan.orgId, loan.id);
    store.persist();
    closeModal();
    toast('Pinjaman disetujui', `${userName(loan.borrowerId)} dapat mengambil ${item.name}.`, 'success');
    render();
    return;
  }

  if (action === 'reject-loan') {
    const loan = store.loanById(data.id);
    if (!loan) return;
    const user = currentUser();
    const allowed = isOrgAdmin() || (!!user && loan.ownerId === user.id);
    if (!allowed) {
      toast('Akses ditolak', 'Hanya pemilik barang atau pengurus yang bisa menolak.', 'danger');
      return;
    }
    openRejectLoanModal(data.id);
    return;
  }

  if (action === 'cancel-loan') {
    const loan = store.loanById(data.id);
    const user = currentUser();
    if (!loan || !user) return;
    if (loan.borrowerId !== user.id || loan.status !== 'Menunggu') {
      toast('Tidak bisa dibatalkan', 'Hanya pengajuan milik Anda yang masih menunggu bisa dibatalkan.', 'danger');
      return;
    }
    const item = store.itemById(loan.itemId);
    loan.status = 'Dibatalkan';
    audit('Membatalkan pengajuan', item ? item.name : 'Barang', 'Dibatalkan oleh peminjam.', loan.orgId, loan.id);
    store.persist();
    closeModal();
    toast('Pengajuan dibatalkan', 'Pengajuan tidak diteruskan ke pemilik barang.', 'info');
    render();
    return;
  }

  if (action === 'return-loan') {
    const loan = store.loanById(data.id);
    if (!loan) return;
    const user = currentUser();
    const allowed = isOrgAdmin() || (!!user && loan.ownerId === user.id);
    if (!allowed) {
      toast('Akses ditolak', 'Hanya pemilik barang atau pengurus yang bisa mengonfirmasi pengembalian.', 'danger');
      return;
    }
    if (loan.status !== 'Aktif') {
      toast('Bukan pinjaman berjalan', 'Hanya pinjaman aktif yang bisa dikembalikan.', 'info');
      return;
    }
    const item = store.itemById(loan.itemId);
    loan.status = 'Selesai';
    loan.completedAt = new Date().toISOString();
    if (item && item.status === 'Dipinjam') item.status = 'Tersedia';
    audit('Mengonfirmasi pengembalian', item ? item.name : 'Barang', `Dikembalikan oleh ${userName(loan.borrowerId)}.`, loan.orgId, loan.id);
    store.persist();
    closeModal();
    toast('Pengembalian dicatat', `${item ? item.name : 'Barang'} kembali tersedia di katalog.`, 'success');
    render();
    return;
  }

  if (action === 'archive-item') {
    const item = store.itemById(data.id);
    const user = currentUser();
    if (!item || !user) return;
    if (item.ownerId !== user.id && !isOrgAdmin()) {
      toast('Akses ditolak', 'Hanya pemilik atau pengurus yang bisa menarik barang.', 'danger');
      return;
    }
    const active = store.loansOfItem(item.id).some((loan) => loan.status === 'Aktif');
    if (active) {
      toast('Masih dipinjam', 'Konfirmasi pengembalian sebelum menarik barang dari katalog.', 'danger');
      return;
    }
    item.status = 'Diarsipkan';
    audit('Menarik barang', item.name, 'Barang disembunyikan dari katalog.', item.orgId);
    store.persist();
    toast('Barang ditarik', `${item.name} tidak tampil di katalog sampai ditayangkan lagi.`, 'info');
    render();
    return;
  }

  if (action === 'restore-item') {
    const item = store.itemById(data.id);
    const user = currentUser();
    if (!item || !user) return;
    if (item.ownerId !== user.id && !isOrgAdmin()) {
      toast('Akses ditolak', 'Hanya pemilik atau pengurus yang bisa menayangkan barang.', 'danger');
      return;
    }
    item.status = 'Tersedia';
    audit('Menayangkan barang', item.name, 'Barang kembali tampil di katalog.', item.orgId);
    store.persist();
    toast('Barang tayang lagi', `${item.name} kembali di katalog organisasi.`, 'success');
    render();
    return;
  }

  if (action === 'delete-announcement') {
    if (!isOrgAdmin()) return;
    const announcement = store.db.announcements.find((entry) => entry.id === data.id);
    if (!announcement) return;
    if (!window.confirm(`Hapus pengumuman "${announcement.title}"?`)) return;
    store.db.announcements = store.db.announcements.filter((entry) => entry.id !== announcement.id);
    audit('Menghapus pengumuman', announcement.title, 'Pengumuman dihapus dari halaman organisasi.', announcement.orgId);
    store.persist();
    toast('Pengumuman dihapus', 'Anggota tidak lagi melihat pengumuman ini.', 'info');
    render();
    return;
  }

  if (action === 'deactivate-org' || action === 'activate-org') {
    const org = currentOrg();
    if (!org || !isOrgAdmin()) return;
    const next = action === 'deactivate-org' ? 'Nonaktif' : 'Aktif';
    org.status = next;
    audit(next === 'Aktif' ? 'Mengaktifkan organisasi' : 'Menonaktifkan organisasi', org.name, `Status organisasi menjadi ${next}.`, org.id);
    store.persist();
    toast(next === 'Aktif' ? 'Organisasi aktif' : 'Organisasi nonaktif', next === 'Aktif'
      ? 'Kode undangan bisa dipakai lagi untuk pendaftaran.'
      : 'Pendaftaran baru dan katalog ditutup sampai organisasi diaktifkan lagi.', 'info');
    render();
    return;
  }

  if (action === 'remove-member') {
    if (!isOrgAdmin()) return;
    const membership = findMembership(data.id);
    if (!membership) return;
    const user = currentUser();
    if (user && membership.userId === user.id) {
      toast('Tidak diizinkan', 'Anda tidak bisa menonaktifkan keanggotaan sendiri.', 'danger');
      return;
    }
    if (!window.confirm(`Nonaktifkan keanggotaan ${userName(membership.userId)}?`)) return;
    membership.status = 'Nonaktif';
    const otherActive = store.membershipsOfUser(membership.userId).some((entry) => entry.status === 'Aktif');
    const member = store.userById(membership.userId);
    if (member && !otherActive) member.status = 'Nonaktif';
    audit('Menonaktifkan keanggotaan', userName(membership.userId), 'Keanggotaan dinonaktifkan pengurus.', membership.orgId);
    store.persist();
    toast('Keanggotaan nonaktif', `${userName(membership.userId)} tidak lagi tercatat aktif di organisasi ini.`, 'info');
    navigate('#/admin-anggota');
    return;
  }

  if (action === 'open-loan') {
    openLoanModal(data.id);
    return;
  }

  if (action === 'reset-catalog') {
    catalogState = { query: '' };
    const input = document.getElementById('catalog-search');
    if (input) input.value = '';
    refreshCatalog();
    return;
  }
}
