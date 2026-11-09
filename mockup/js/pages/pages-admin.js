/**
 * Administrator screens: circulation, verification, organisation, directory, members, structure.
 * Loaded before app.js. Helpers and state live in app.js.
 */

function adminLinks(current) {
  const links = [
    ['#/admin-monitoring', 'Monitoring'],
    ['#/admin-verifikasi', 'Verifikasi'],
    ['#/admin-anggota', 'Anggota'],
    ['#/admin-organisasi', 'Organisasi'],
    ['#/admin-bagan', 'Bagan'],
    ['#/admin-direktori', 'Direktori'],
    ['#/pengumuman', 'Pengumuman']
  ];
  return `<nav class="admin-nav" aria-label="Navigasi pengurus">${links.map(([href, label]) => `<a href="${href}" ${href === current ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`;
}

function adminLoansOfOrg() {
  const org = currentOrg();
  if (!org) return [];
  return store.db.loans
    .filter((loan) => loan.orgId === org.id)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function adminLoanMatches(loan, normalized) {
  if (!normalized) return true;
  const item = store.itemById(loan.itemId);
  const borrower = store.userById(loan.borrowerId);
  const owner = loan.ownerId ? store.userById(loan.ownerId) : null;
  return `${item ? item.name : ''} ${borrower ? borrower.name : ''} ${owner ? owner.name : ''}`.toLowerCase().includes(normalized);
}

function filteredAdminLoans(query) {
  const normalized = String(query || '').trim().toLowerCase();
  return adminLoansOfOrg().filter((loan) => adminLoanMatches(loan, normalized));
}

function adminLoanRows(query) {
  const loans = filteredAdminLoans(query);

  if (!loans.length) {
    return `<tr><td colspan="6"><div class="empty" style="padding:1.25rem"><p class="empty-title">Tidak ada transaksi</p><p class="empty-body">Ubah kata kunci pencarian.</p></div></td></tr>`;
  }

  return loans.map((loan) => {
    const item = store.itemById(loan.itemId);
    const borrower = store.userById(loan.borrowerId);
    const owner = loan.ownerId ? store.userById(loan.ownerId) : null;
    const display = loan.status === 'Aktif' && isOverdue(loan) ? 'Terlambat' : loan.status;
    return `<tr>
      <td><span class="cell-main">${esc(item ? item.name : 'Barang dihapus')}</span><span class="cell-sub">${esc(item ? item.code : '—')}</span></td>
      <td>${esc(borrower ? borrower.name : 'Anggota')}</td>
      <td>${esc(owner ? owner.name : 'Aset organisasi')}</td>
      <td><span class="cell-main">${fmtDate(loan.start)}</span><span class="cell-sub">s.d. ${fmtDate(loan.end)}</span></td>
      <td>${tag(display)}</td>
      <td><button class="btn-secondary btn-sm" type="button" data-action="open-loan" data-id="${esc(loan.id)}">Rincian</button></td>
    </tr>`;
  }).join('');
}

function refreshAdminLoans() {
  const body = document.getElementById('admin-loan-rows');
  if (!body) return;
  body.innerHTML = adminLoanRows(adminLoanQuery);
  const count = document.getElementById('admin-loan-count');
  if (count) count.textContent = `${filteredAdminLoans(adminLoanQuery).length} transaksi`;
}

function renderAdminMonitoring() {
  if (!isOrgAdmin()) return restrictedBlock('Monitoring sirkulasi', 'Halaman ini hanya untuk pengurus organisasi aktif.');
  const org = currentOrg();
  const loans = adminLoansOfOrg();
  const overdue = loans.filter((loan) => loan.status === 'Aktif' && isOverdue(loan)).length;

  return `
    <div class="page page-wide">
      ${pageHead({
        kicker: 'Pengurus · UC-AD-04',
        title: 'Monitoring sirkulasi',
        lede: `Semua pinjaman di ${esc(org.name)}. Gunakan pencarian untuk menemukan barang atau anggota.`
      })}
      ${adminLinks('#/admin-monitoring')}

      <div class="stat-strip">
        <div class="stat"><span class="stat-value">${loans.length}</span><span class="stat-label">Total transaksi</span></div>
        <div class="stat"><span class="stat-value">${loans.filter((loan) => loan.status === 'Menunggu').length}</span><span class="stat-label">Menunggu</span></div>
        <div class="stat"><span class="stat-value">${loans.filter((loan) => loan.status === 'Aktif').length}</span><span class="stat-label">Sedang berjalan</span></div>
        <div class="stat"><span class="stat-value">${overdue}</span><span class="stat-label">Terlambat</span></div>
      </div>

      <div class="toolbar">
        <div class="search-row">
          <label class="sr-only" for="admin-loan-search">Cari transaksi</label>
          <input class="form-input" id="admin-loan-search" type="search" placeholder="Cari barang, peminjam, atau pemilik" autocomplete="off">
          <a class="btn-secondary" href="#/admin-verifikasi">Verifikasi pengajuan</a>
        </div>
        <p class="tiny muted" id="admin-loan-count" aria-live="polite">${loans.length} transaksi</p>
      </div>

      <div class="table-scroll" tabindex="0" role="region" aria-label="Tabel sirkulasi barang">
        <table class="ruled-table">
          <caption class="sr-only">Daftar transaksi pinjaman organisasi</caption>
          <thead><tr><th>Barang</th><th>Peminjam</th><th>Pemilik</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody id="admin-loan-rows">${adminLoanRows('')}</tbody>
        </table>
      </div>
    </div>`;
}

function pendingMemberCard(membership) {
  const user = store.userById(membership.userId);
  if (!user) return '';
  const docImg = membership.documentImage || user.documentImage || 'img/sample-ktp.svg';
  const docName = membership.documentName || user.documentName || 'Dokumen_Keanggotaan.svg';
  const docType = membership.documentType || user.documentType || 'KTP / Kartu Identitas';

  return `
    <div class="list-item pending-card">
      <div class="pending-card-layout">
        <button class="doc-thumb-preview" type="button" data-action="view-member-doc" data-id="${esc(membership.id)}" aria-label="Buka dokumen verifikasi ${esc(user.name)}" title="Klik untuk membuka pop up dokumen">
          <img src="${esc(docImg)}" alt="Dokumen ${esc(user.name)}" class="doc-thumb-img">
          <span class="doc-thumb-tag">👁️ Buka Dokumen</span>
        </button>

        <div class="pending-card-content">
          <div class="item-head" style="margin-bottom:.4rem">
            <div>
              <span class="cell-main">${esc(user.name)}</span>
              <span class="cell-sub">
                <a class="link" href="${waHref(user.wa)}" target="_blank" rel="noopener">📱 ${esc(user.wa)}</a> · diajukan ${fmtDate(membership.joinedAt)}
              </span>
            </div>
            ${tag(membership.status)}
          </div>

          <div class="pending-doc-meta" style="margin-bottom:.35rem">
            <span class="badge-doc-type">📄 ${esc(docType)}</span>
            <span class="tiny mono muted">${esc(docName)}</span>
          </div>

          ${user.address ? `<p class="tiny muted" style="margin-top:.15rem"><strong>Alamat/Divisi:</strong> ${esc(user.address)}</p>` : ''}
          ${user.documentNote ? `<p class="tiny italic muted" style="margin-top:.15rem">${esc(user.documentNote)}</p>` : ''}

          <div class="actions" style="margin-top:.75rem">
            <button class="btn-secondary btn-sm" type="button" data-action="view-member-doc" data-id="${esc(membership.id)}">
              🔍 Cek Detail & Dokumen
            </button>
            <button class="btn-primary btn-sm" type="button" data-action="approve-member" data-id="${esc(membership.id)}">
              ✓ Setujui
            </button>
            <button class="btn-danger btn-sm" type="button" data-action="reject-member" data-id="${esc(membership.id)}">
              ✕ Tolak
            </button>
          </div>
        </div>
      </div>

      ${(membership.documentName || membership.documentImage || user.documentName || user.documentImage) ? `
      <section class="section-rule">
        <div class="section-head">
          <h2>Dokumen Verifikasi Keanggotaan</h2>
          <p>Foto identitas yang dilampirkan pemohon saat mendaftar ke organisasi.</p>
        </div>
        <div class="panel panel-pad">
          <div class="doc-registered-row">
            <div class="doc-thumb-preview" style="cursor:default">
              <img src="${esc(membership.documentImage || user.documentImage || 'img/sample-ktp.svg')}" alt="Dokumen ${esc(user.name)}" class="doc-thumb-img">
            </div>
            <div class="pending-card-content">
              <p class="small"><strong>Jenis Dokumen:</strong> ${esc(membership.documentType || user.documentType || 'KTP / Identitas Resmi')}</p>
              <p class="small mono tiny muted"><strong>Berkas:</strong> ${esc(membership.documentName || user.documentName || 'Dokumen_Keanggotaan.svg')}</p>
              ${(membership.documentNote || user.documentNote) ? `<p class="tiny muted" style="margin-top:.25rem">${esc(membership.documentNote || user.documentNote)}</p>` : ''}
              <div style="margin-top:.75rem">
                <button class="btn-secondary btn-sm" type="button" data-action="view-member-doc" data-id="${esc(membership.id)}">
                  🔍 Buka Pop-Up Dokumen Penuh
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>` : ''}
    </div>`;
}

function pendingLoanCard(loan) {
  const item = store.itemById(loan.itemId);
  const borrower = store.userById(loan.borrowerId);
  if (!item) return '';
  return `<div class="list-item">
    <div class="item-head" style="margin-bottom:.5rem;padding-bottom:.5rem">
      <div><span class="cell-main">${esc(item.name)}</span><span class="cell-sub">${esc(borrower ? borrower.name : 'Anggota')} · ${fmtDate(loan.start)} – ${fmtDate(loan.end)}</span></div>
      ${tag(loan.status)}
    </div>
    <p class="small muted">${esc(loan.purpose)}</p>
    <p class="tiny muted">Pemilik: ${esc(loan.ownerId ? userName(loan.ownerId) : 'Aset organisasi')} · barang saat ini ${esc(item.status.toLowerCase())}</p>
    <div class="actions">
      <button class="btn-primary btn-sm" type="button" data-action="approve-loan" data-id="${esc(loan.id)}">Setujui</button>
      <button class="btn-danger btn-sm" type="button" data-action="reject-loan" data-id="${esc(loan.id)}">Tolak</button>
      <button class="btn-secondary btn-sm" type="button" data-action="open-loan" data-id="${esc(loan.id)}">Rincian</button>
    </div>
  </div>`;
}

function renderAdminVerifikasi() {
  if (!isOrgAdmin()) return restrictedBlock('Verifikasi', 'Halaman ini hanya untuk pengurus organisasi aktif.');
  const org = currentOrg();
  const pendingMembers = store.membersOf(org.id).filter((m) => m.status === 'Menunggu Verifikasi');
  const pendingLoans = adminLoansOfOrg().filter((loan) => loan.status === 'Menunggu');

  return `
    <div class="page page-wide">
      ${pageHead({
        kicker: 'Pengurus · UC-AD-01',
        title: 'Verifikasi anggota dan pinjaman',
        lede: 'Periksa pendaftar baru dan pengajuan pinjaman yang menunggu keputusan.'
      })}
      ${adminLinks('#/admin-verifikasi')}

      <div class="grid-2">
        <section>
          <div class="section-head"><h2>Anggota menunggu (${pendingMembers.length})</h2><p>Setujui setelah nomor WhatsApp dan dokumen cocok.</p></div>
          ${pendingMembers.length ? `<div class="list">${pendingMembers.map(pendingMemberCard).join('')}</div>` : emptyState('Tidak ada pendaftar baru', 'Semua pendaftaran sudah diperiksa.', '')}
        </section>

        <section>
          <div class="section-head"><h2>Pinjaman menunggu (${pendingLoans.length})</h2><p>Persetujuan akan mengubah status barang menjadi dipinjam.</p></div>
          ${pendingLoans.length ? `<div class="list">${pendingLoans.map(pendingLoanCard).join('')}</div>` : emptyState('Tidak ada pengajuan menunggu', 'Pengajuan baru akan muncul di sini.', '')}
        </section>
      </div>
    </div>`;
}

function auditListHtml(orgId) {
  const entries = store.auditOf(orgId).slice(0, 6);
  if (!entries.length) return '<p class="small muted">Belum ada aktivitas.</p>';
  return `<div class="list">${entries.map((entry) => `<div class="list-item">
    <span class="cell-main">${esc(entry.action)} — ${esc(entry.target)}</span>
    <span class="cell-sub">${esc(userName(entry.actorId))} · ${fmtDateTime(entry.createdAt)}</span>
    ${entry.note ? `<p class="tiny muted">${esc(entry.note)}</p>` : ''}
  </div>`).join('')}</div>`;
}

function renderAdminOrganisasi() {
  if (!isOrgAdmin()) return restrictedBlock('Kelola organisasi', 'Halaman ini hanya untuk pengurus organisasi aktif.');
  const org = currentOrg();
  const members = store.activeMembersOf(org.id).length;
  const items = store.itemsOf(org.id).length;

  return `
    <div class="page page-wide">
      ${pageHead({
        kicker: 'Pengurus · UC-AD-02',
        title: org.name,
        lede: `${esc(org.type)} · ${members} anggota aktif · ${items} barang`,
        actions: isPlatformAdmin() ? `<a class="btn-primary" href="#/admin-buat-organisasi">Buat organisasi</a><a class="btn-secondary" href="#/admin-direktori">Direktori</a>` : ''
      })}
      ${adminLinks('#/admin-organisasi')}

      <div class="grid-2">
        <div class="panel panel-pad">
          <h2 style="font-size:1rem;margin-bottom:.6rem">Profil organisasi</h2>
          <form data-form="org" novalidate>
            <div class="field">
              <label class="label" for="org-name">Nama organisasi</label>
              <input class="form-input" id="org-name" name="name" value="${esc(org.name)}" required>
            </div>
            <div class="form-grid two">
              <div class="field">
                <label class="label" for="org-type">Jenis</label>
                <select class="form-input" id="org-type" name="type">
                  ${ORG_TYPES.map((type) => `<option value="${esc(type)}" ${type === org.type ? 'selected' : ''}>${esc(type)}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label class="label" for="org-contact">Kontak pengurus</label>
                <input class="form-input" id="org-contact" name="contact" value="${esc(org.contact)}" required>
              </div>
            </div>
            <div class="field">
              <label class="label" for="org-address">Alamat atau lokasi</label>
              <input class="form-input" id="org-address" name="address" value="${esc(org.address)}" required>
            </div>
            <div class="field">
              <label class="label" for="org-expiry">Kode undangan berlaku sampai</label>
              <input class="form-input" id="org-expiry" name="inviteExpires" type="date" value="${esc(org.inviteExpires)}" required>
            </div>
            <button class="btn-primary form-submit" type="submit">Simpan profil</button>
          </form>
        </div>

        <div class="stack">
          <div class="invite-box">
            <div>
              <span class="tiny strong">Kode undangan</span>
              <div class="invite-code">${esc(org.inviteCode)}</div>
              <span class="tiny muted">Berlaku sampai ${fmtDate(org.inviteExpires)}</span>
            </div>
            <div class="actions">
              <button class="btn-secondary btn-sm" type="button" data-action="copy-invite" data-code="${esc(org.inviteCode)}">Salin</button>
              <button class="btn-secondary btn-sm" type="button" data-action="regenerate-invite">Ganti kode</button>
            </div>
          </div>

          <div class="panel panel-pad">
            <h2 style="font-size:1rem;margin-bottom:.5rem">Status organisasi</h2>
            <p class="small muted">Status saat ini: ${tag(org.status)}</p>
            <div class="btn-row" style="margin-top:.65rem">
              ${org.status === 'Aktif'
                ? `<button class="btn-danger btn-sm" type="button" data-action="deactivate-org">Nonaktifkan organisasi</button>`
                : `<button class="btn-primary btn-sm" type="button" data-action="activate-org">Aktifkan organisasi</button>`}
              <a class="btn-secondary btn-sm" href="#/admin-anggota">Kelola anggota</a>
            </div>
            <p class="tiny muted" style="margin-top:.5rem">Organisasi nonaktif tidak bisa menerima anggota baru lewat kode undangan.</p>
          </div>

          <div class="panel panel-pad">
            <h2 style="font-size:1rem;margin-bottom:.5rem">Aktivitas terakhir</h2>
            ${auditListHtml(org.id)}
          </div>
        </div>
      </div>
    </div>`;
}

function orgCard(org) {
  const members = store.activeMembersOf(org.id).length;
  const items = store.itemsOf(org.id).length;
  const me = currentUser();
  const membership = me ? store.membership(me.id, org.id) : null;
  const canManage = membership && membership.status === 'Aktif' && (membership.role === 'Pengurus' || membership.role === 'Org Admin');
  return `<article class="org-card">
    <div class="org-card-head"><h2>${esc(org.name)}</h2>${tag(org.status === 'Aktif' ? 'Aktif' : 'Nonaktif')}</div>
    <div class="org-meta"><span>${esc(org.type)}</span><span>${members} anggota</span><span>${items} barang</span></div>
    <p class="small muted">${esc(org.address)}</p>
    <p class="tiny muted">Kode undangan: <span class="mono">${esc(org.inviteCode)}</span></p>
    <div class="actions">
      ${canManage ? `<button class="btn-secondary btn-sm" type="button" data-action="manage-org" data-org="${esc(org.id)}">Kelola</button>` : `<span class="tiny muted">Anda belum menjadi pengurus di sini.</span>`}
    </div>
  </article>`;
}

function directoryCards(query) {
  const normalized = String(query || '').trim().toLowerCase();
  const orgs = store.db.organizations.filter((org) => {
    if (!normalized) return true;
    return `${org.name} ${org.type} ${org.address}`.toLowerCase().includes(normalized);
  });
  if (!orgs.length) return `<div class="empty"><p class="empty-title">Organisasi tidak ditemukan</p><p class="empty-body">Coba kata kunci lain.</p></div>`;
  return orgs.map(orgCard).join('');
}

function refreshDirectory() {
  const grid = document.getElementById('directory-grid');
  if (grid) grid.innerHTML = directoryCards(directoryQuery);
}

function renderAdminDirektori() {
  if (!isPlatformAdmin()) return restrictedBlock('Direktori organisasi', 'Halaman ini hanya untuk admin platform.');
  const totalMembers = store.db.memberships.filter((m) => m.status === 'Aktif').length;

  return `
    <div class="page page-wide">
      ${pageHead({
        kicker: 'Admin platform',
        title: 'Direktori organisasi',
        lede: `${store.db.organizations.length} organisasi · ${totalMembers} keanggotaan aktif. Admin platform membuat organisasi dan mengatur akses awal.`,
        actions: `<a class="btn-primary" href="#/admin-buat-organisasi">Buat organisasi</a>`
      })}
      ${adminLinks('#/admin-direktori')}

      <div class="toolbar">
        <div class="search-row">
          <label class="sr-only" for="directory-search">Cari organisasi</label>
          <input class="form-input" id="directory-search" type="search" placeholder="Cari nama, jenis, atau lokasi" autocomplete="off">
        </div>
      </div>

      <div class="org-grid" id="directory-grid">${directoryCards('')}</div>
    </div>`;
}

function renderAdminBuatOrganisasi() {
  if (!isPlatformAdmin()) return restrictedBlock('Buat organisasi', 'Halaman ini hanya untuk admin platform.');
  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Admin platform',
        title: 'Buat organisasi baru',
        lede: 'Organisasi tidak dibuat lewat pendaftaran publik. Admin membuat wadah, lalu pengurus mengundang anggotanya.',
        actions: `<a class="btn-secondary" href="#/admin-direktori">Kembali ke direktori</a>`
      })}

      <div class="grid-2">
        <div class="panel panel-pad">
          <form data-form="create-org" novalidate>
            <div class="field">
              <label class="label" for="new-org-name">Nama organisasi</label>
              <input class="form-input" id="new-org-name" name="name" required>
            </div>
            <div class="form-grid two">
              <div class="field">
                <label class="label" for="new-org-type">Jenis</label>
                <select class="form-input" id="new-org-type" name="type">${ORG_TYPES.map((type) => `<option value="${esc(type)}">${esc(type)}</option>`).join('')}</select>
              </div>
              <div class="field">
                <label class="label" for="new-org-contact">Kontak pengurus</label>
                <input class="form-input" id="new-org-contact" name="contact" placeholder="08xx" required>
              </div>
            </div>
            <div class="field">
              <label class="label" for="new-org-address">Alamat atau lokasi</label>
              <input class="form-input" id="new-org-address" name="address" required>
            </div>
            <div class="form-grid two">
              <div class="field">
                <label class="label" for="new-org-invite">Kode undangan</label>
                <input class="form-input mono" id="new-org-invite" name="invite" placeholder="Otomatis bila kosong">
              </div>
              <div class="field">
                <label class="label" for="new-org-expiry">Berlaku sampai</label>
                <input class="form-input" id="new-org-expiry" name="inviteExpires" type="date" value="${addDaysISO(todayISO(), 180)}" required>
              </div>
            </div>
            <button class="btn-primary btn-block form-submit" type="submit">Buat organisasi</button>
          </form>
        </div>

        <div class="stack">
          <div class="alert alert-info"><strong>Anda menjadi Pengurus pertama</strong>Setelah organisasi dibuat, akun Anda tercatat sebagai Pengurus dengan posisi Ketua. Anda bisa mengundang pengurus atau anggota lain lewat halaman anggota.</div>
          <div class="well">
            <p class="small strong">Kode undangan</p>
            <p class="small muted" style="margin-top:.25rem">Kode dipakai calon anggota saat mendaftar. Kode bisa diganti kapan saja dari halaman organisasi.</p>
          </div>
        </div>
      </div>
    </div>`;
}

function adminMemberRows() {
  const org = currentOrg();
  const query = memberQuery.trim().toLowerCase();
  const rows = store.membersOf(org.id)
    .filter((m) => memberStatusFilter === 'Semua' || m.status === memberStatusFilter)
    .filter((m) => {
      const user = store.userById(m.userId);
      if (!user) return false;
      if (!query) return true;
      return `${user.name} ${user.wa} ${m.role} ${m.position}`.toLowerCase().includes(query);
    })
    .sort(sortMembers);

  if (!rows.length) return `<tr><td colspan="5"><div class="empty" style="padding:1.25rem"><p class="empty-title">Tidak ada anggota</p><p class="empty-body">Ubah filter atau kata kunci.</p></div></td></tr>`;

  return rows.map((m) => {
    const user = store.userById(m.userId);
    return `<tr>
      <td><span class="cell-main">${esc(user.name)}</span><span class="cell-sub">${esc(user.wa)}</span></td>
      <td><span class="cell-main">${esc(m.role)}</span><span class="cell-sub">${esc(m.position)}</span></td>
      <td>${tag(m.status)}</td>
      <td>${fmtDate(m.joinedAt)}</td>
      <td><a class="btn-secondary btn-sm" href="#/admin-anggota-detail?id=${esc(m.id)}">Rincian</a></td>
    </tr>`;
  }).join('');
}

function refreshAdminMembers() {
  const body = document.getElementById('admin-member-rows');
  if (!body) return;
  body.innerHTML = adminMemberRows();
  document.querySelectorAll('[data-member-status]').forEach((button) => {
    button.classList.toggle('chip-active', button.dataset.memberStatus === memberStatusFilter);
  });
}

function renderAdminAnggota() {
  if (!isOrgAdmin()) return restrictedBlock('Kelola anggota', 'Halaman ini hanya untuk pengurus organisasi aktif.');
  const org = currentOrg();
  const memberships = store.membersOf(org.id);
  memberStatusFilter = 'Semua';
  memberQuery = '';
  const statuses = ['Semua', ...MEMBER_STATUSES];
  const counts = statuses.map((status) => [status, status === 'Semua' ? memberships.length : memberships.filter((m) => m.status === status).length]);

  return `
    <div class="page page-wide">
      ${pageHead({
        kicker: 'Pengurus · UC-AD-03',
        title: 'Anggota organisasi',
        lede: `Daftar keanggotaan ${esc(org.name)}, termasuk yang menunggu verifikasi.`,
        actions: `<a class="btn-primary" href="#/admin-tambah-anggota">Tambah anggota</a>`
      })}
      ${adminLinks('#/admin-anggota')}

      <div class="toolbar">
        <div class="search-row">
          <label class="sr-only" for="member-search">Cari anggota</label>
          <input class="form-input" id="member-search" type="search" placeholder="Cari nama, WhatsApp, atau posisi" autocomplete="off">
        </div>
        <div class="chips" role="group" aria-label="Filter status anggota">
          ${counts.map(([status, count]) => `<button class="chip ${status === 'Semua' ? 'chip-active' : ''}" type="button" data-member-status="${esc(status)}">${esc(status)} <small>${count}</small></button>`).join('')}
        </div>
      </div>

      <div class="table-scroll" tabindex="0" role="region" aria-label="Tabel anggota">
        <table class="ruled-table">
          <caption class="sr-only">Daftar anggota organisasi</caption>
          <thead><tr><th>Nama</th><th>Peran dan posisi</th><th>Status</th><th>Bergabung</th><th>Aksi</th></tr></thead>
          <tbody id="admin-member-rows">${adminMemberRows()}</tbody>
        </table>
      </div>
    </div>`;
}

function renderAdminAnggotaDetail(params) {
  if (!isOrgAdmin()) return restrictedBlock('Rincian anggota', 'Halaman ini hanya untuk pengurus organisasi aktif.');
  const membership = params && params.id ? store.db.memberships.find((m) => m.id === params.id) : null;
  if (!membership || membership.orgId !== currentOrg().id) {
    return `<div class="page page-mid">${pageHead({ kicker: 'Anggota', title: 'Data anggota tidak ditemukan' })}<div class="empty"><p class="empty-title">Tautan tidak valid</p><a class="btn-primary" href="#/admin-anggota">Kembali ke daftar anggota</a></div></div>`;
  }
  const user = store.userById(membership.userId);
  if (!user) return emptyPage('Rincian anggota', 'Data pengguna tidak ditemukan.');

  const loans = store.db.loans.filter((loan) => loan.orgId === membership.orgId && loan.borrowerId === user.id);
  const owned = store.itemsOf(membership.orgId).filter((item) => item.ownerId === user.id);
  const me = currentUser();

  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Pengurus · anggota',
        title: user.name,
        lede: `${esc(membership.role)} · ${esc(membership.position)} · bergabung ${fmtDate(membership.joinedAt)}`,
        actions: `<a class="btn-secondary" href="#/admin-anggota">Kembali</a>`
      })}

      <div class="grid-2">
        <div class="panel panel-pad">
          <h2 style="font-size:1rem;margin-bottom:.6rem">Data anggota</h2>
          <dl class="profile-list">
            <div class="profile-row"><dt>WhatsApp</dt><dd><a class="link" href="${waHref(user.wa)}" target="_blank" rel="noopener">${esc(user.wa)}</a></dd></div>
            <div class="profile-row"><dt>Alamat</dt><dd>${esc(user.address || '—')}</dd></div>
            <div class="profile-row"><dt>Status akun</dt><dd>${tag(user.status)}</dd></div>
            <div class="profile-row"><dt>Status keanggotaan</dt><dd>${tag(membership.status)}</dd></div>
            <div class="profile-row"><dt>Pinjaman tercatat</dt><dd>${loans.length}</dd></div>
            <div class="profile-row"><dt>Barang dimiliki</dt><dd>${owned.length}</dd></div>
          </dl>
        </div>

        <div class="panel panel-pad">
          <h2 style="font-size:1rem;margin-bottom:.6rem">Atur peran dan status</h2>
          <form data-form="member-edit" novalidate>
            <input type="hidden" name="id" value="${esc(membership.id)}">
            <div class="field">
              <label class="label" for="member-role">Peran</label>
              <select class="form-input" id="member-role" name="role">
                ${ROLE_OPTIONS.map((role) => `<option value="${esc(role)}" ${role === membership.role ? 'selected' : ''}>${esc(role)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label class="label" for="member-position">Posisi di bagan</label>
              <input class="form-input" id="member-position" name="position" value="${esc(membership.position)}">
            </div>
            <div class="field">
              <label class="label" for="member-status">Status keanggotaan</label>
              <select class="form-input" id="member-status" name="status">
                ${MEMBER_STATUSES.map((status) => `<option value="${esc(status)}" ${status === membership.status ? 'selected' : ''}>${esc(status)}</option>`).join('')}
              </select>
            </div>
            <button class="btn-primary form-submit" type="submit">Simpan perubahan</button>
          </form>
          ${membership.userId !== (me ? me.id : '') ? `<div class="btn-row" style="margin-top:.75rem"><button class="btn-danger btn-sm" type="button" data-action="remove-member" data-id="${esc(membership.id)}">Nonaktifkan keanggotaan</button></div>` : '<p class="tiny muted" style="margin-top:.65rem">Anda tidak bisa menonaktifkan akun sendiri.</p>'}
        </div>
      </div>

      ${(membership.documentName || membership.documentImage || user.documentName || user.documentImage) ? `
      <section class="section-rule">
        <div class="section-head">
          <h2>Dokumen Verifikasi Keanggotaan</h2>
          <p>Foto identitas yang dilampirkan pemohon saat mendaftar ke organisasi.</p>
        </div>
        <div class="panel panel-pad">
          <div class="doc-registered-row">
            <div class="doc-thumb-preview" style="cursor:default">
              <img src="${esc(membership.documentImage || user.documentImage || 'img/sample-ktp.svg')}" alt="Dokumen ${esc(user.name)}" class="doc-thumb-img">
            </div>
            <div class="pending-card-content">
              <p class="small"><strong>Jenis Dokumen:</strong> ${esc(membership.documentType || user.documentType || 'KTP / Identitas Resmi')}</p>
              <p class="small mono tiny muted"><strong>Berkas:</strong> ${esc(membership.documentName || user.documentName || 'Dokumen_Keanggotaan.svg')}</p>
              ${(membership.documentNote || user.documentNote) ? `<p class="tiny muted" style="margin-top:.25rem">${esc(membership.documentNote || user.documentNote)}</p>` : ''}
              <div style="margin-top:.75rem">
                <button class="btn-secondary btn-sm" type="button" data-action="view-member-doc" data-id="${esc(membership.id)}">
                  🔍 Buka Pop-Up Dokumen Penuh
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>` : ''}

      <section class="section-rule">
        <div class="section-head"><h2>Pinjaman sebagai peminjam</h2><p>Riwayat pinjaman anggota ini.</p></div>
        ${loans.length ? `<div class="list">${loans.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map((loan) => {
          const item = store.itemById(loan.itemId);
          return `<div class="list-item row"><div><span class="cell-main">${esc(item ? item.name : 'Barang')}</span><span class="cell-sub">${fmtDate(loan.start)} – ${fmtDate(loan.end)} · ${esc(loan.status)}</span></div><div class="actions"><button class="btn-secondary btn-sm" type="button" data-action="open-loan" data-id="${esc(loan.id)}">Rincian</button></div></div>`;
        }).join('')}</div>` : '<p class="small muted">Belum ada pinjaman.</p>'}
      </section>

      <section class="section-rule">
        <div class="section-head"><h2>Barang yang dimiliki</h2><p>Barang yang ditayangkan anggota ini di katalog.</p></div>
        ${owned.length ? `<div class="list">${owned.map((item) => `<div class="list-item row"><div><span class="cell-main">${esc(item.name)}</span><span class="cell-sub">Kode: ${esc(item.code)} · ${esc(item.status)}</span></div><div class="actions"><a class="btn-secondary btn-sm" href="#/detail-barang?id=${esc(item.id)}">Lihat</a></div></div>`).join('')}</div>` : '<p class="small muted">Belum ada barang.</p>'}
      </section>
    </div>`;
}

function renderAdminTambahAnggota() {
  if (!isOrgAdmin()) return restrictedBlock('Tambah anggota', 'Halaman ini hanya untuk pengurus organisasi aktif.');
  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Pengurus · anggota',
        title: 'Tambah anggota manual',
        lede: 'Dipakai untuk anggota yang didaftarkan pengurus, misalnya warga tanpa ponsel atau staf baru.',
        actions: `<a class="btn-secondary" href="#/admin-anggota">Kembali ke daftar</a>`
      })}

      <div class="grid-2">
        <div class="panel panel-pad">
          <form data-form="member-add" novalidate>
            <div class="field">
              <label class="label" for="add-member-name">Nama lengkap</label>
              <input class="form-input" id="add-member-name" name="name" required>
            </div>
            <div class="field">
              <label class="label" for="add-member-wa">Nomor WhatsApp</label>
              <input class="form-input" id="add-member-wa" name="wa" type="tel" inputmode="tel" required>
              <p class="hint">Bila nomor sudah terdaftar, akun yang ada akan ditambahkan ke organisasi ini.</p>
            </div>
            <div class="field">
              <label class="label" for="add-member-address">Alamat atau unit</label>
              <input class="form-input" id="add-member-address" name="address">
            </div>
            <div class="form-grid two">
              <div class="field">
                <label class="label" for="add-member-role">Peran</label>
                <select class="form-input" id="add-member-role" name="role">${ROLE_OPTIONS.map((role) => `<option value="${esc(role)}">${esc(role)}</option>`).join('')}</select>
              </div>
              <div class="field">
                <label class="label" for="add-member-position">Posisi</label>
                <input class="form-input" id="add-member-position" name="position" value="Anggota">
              </div>
            </div>
            <button class="btn-primary btn-block form-submit" type="submit">Tambahkan ke organisasi</button>
          </form>
        </div>

        <div class="well">
          <p class="small strong">Kata sandi awal</p>
          <p class="small muted" style="margin-top:.25rem">Akun baru memakai kata sandi <span class="mono">sarga123</span> dan langsung berstatus aktif. Minta anggota menggantinya dari halaman profil.</p>
          <hr class="divider">
          <p class="small strong">Berbeda dari pendaftaran mandiri</p>
          <p class="small muted" style="margin-top:.25rem">Pendaftaran mandiri memakai kode undangan dan menunggu verifikasi. Penambahan manual adalah keputusan pengurus, jadi langsung aktif.</p>
        </div>
      </div>
    </div>`;
}

function renderAdminBagan() {
  if (!isOrgAdmin()) return restrictedBlock('Bagan organisasi', 'Halaman ini hanya untuk pengurus organisasi aktif.');
  const org = currentOrg();
  const members = store.activeMembersOf(org.id).slice().sort(sortMembers);

  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Pengurus · organisasi',
        title: 'Bagan dan peran',
        lede: `Atur posisi setiap anggota aktif di ${esc(org.name)}. Anggota hanya dapat melihat hasilnya.`,
        actions: `<a class="btn-secondary" href="#/struktur">Lihat bagan</a><a class="btn-secondary" href="#/admin-tambah-anggota">Tambah anggota</a>`
      })}
      ${adminLinks('#/admin-bagan')}

      <div class="alert alert-info" style="margin-bottom:1rem"><strong>Peran menentukan akses</strong>Pengurus bisa membuka portal pengurus dan verifikasi. Anggota hanya bisa meminjam, menayangkan barang, dan melihat struktur.</div>

      <form data-form="structure" novalidate>
        <div class="list">
          ${members.length ? members.map((m) => {
            const user = store.userById(m.userId);
            if (!user) return '';
            return `<div class="list-item">
              <div class="member-cell"><span class="avatar avatar-sm" aria-hidden="true">${initials(user.name)}</span><div><span class="cell-main">${esc(user.name)}</span><span class="cell-sub">${esc(user.wa)}</span></div></div>
              <div class="form-grid two" style="margin-top:.75rem">
                <div class="field">
                  <label class="label" for="position-${esc(m.id)}">Posisi</label>
                  <input class="form-input" id="position-${esc(m.id)}" name="position-${esc(m.id)}" value="${esc(m.position)}">
                </div>
                <div class="field">
                  <label class="label" for="role-${esc(m.id)}">Peran</label>
                  <select class="form-input" id="role-${esc(m.id)}" name="role-${esc(m.id)}">${ROLE_OPTIONS.map((role) => `<option value="${esc(role)}" ${role === m.role ? 'selected' : ''}>${esc(role)}</option>`).join('')}</select>
                </div>
              </div>
            </div>`;
          }).join('') : `<div class="empty"><p class="empty-title">Belum ada anggota aktif</p><p class="empty-body">Tambahkan anggota terlebih dahulu.</p></div>`}
        </div>
        ${members.length ? `<button class="btn-primary form-submit" type="submit">Simpan bagan</button>` : ''}
      </form>

      <p class="hint" style="margin-top:.75rem">Minimal satu anggota harus tetap menjadi Pengurus. Untuk posisi baru, tambahkan anggota lalu ubah posisinya di sini.</p>
    </div>`;
}
