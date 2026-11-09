/**
 * Member screens: catalog, item detail, loan request, loans, own items, structure, announcements, profile.
 * Loaded before app.js. State variables and helpers live in app.js.
 */

function itemCard(item) {
  const owner = item.ownerId ? store.userById(item.ownerId) : null;
  return `
    <article class="item-card">
      <div class="photo-frame item-photo">
        <img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" onerror="this.src='img/placeholder-item.svg'">
        <span class="photo-badge">${tag(item.status)}</span>
      </div>
      <div class="item-body">
        <h3 class="item-title"><a href="#/detail-barang?id=${esc(item.id)}">${esc(item.name)}</a></h3>
        <p class="item-desc">${esc(item.description)}</p>
        <dl class="meta-list">
          <div><dt>Pemilik</dt><dd>${esc(owner ? owner.name : 'Aset organisasi')}</dd></div>
          <div><dt>Maksimal</dt><dd>${item.maxDays} hari</dd></div>
        </dl>
        <a class="btn-secondary" href="#/detail-barang?id=${esc(item.id)}">Lihat rincian</a>
      </div>
    </article>`;
}

function catalogSource() {
  const org = currentOrg();
  return org ? store.itemsOf(org.id).filter((item) => item.status !== 'Diarsipkan') : [];
}

function catalogResults() {
  const query = catalogState.query.trim().toLowerCase();
  return catalogSource().filter((item) => {
    const haystack = `${item.name} ${item.description} ${item.code}`.toLowerCase();
    return !query || haystack.includes(query);
  });
}

function catalogGridHtml() {
  const results = catalogResults();
  if (!results.length) {
    return `<div class="empty"><p class="empty-title">Tidak ada alat yang cocok</p><p class="empty-body">Coba kata kunci pencarian lain.</p><button class="btn-secondary" type="button" data-action="reset-catalog">Tampilkan semua</button></div>`;
  }
  return results.map(itemCard).join('');
}

function refreshCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  grid.innerHTML = catalogGridHtml();
  const count = document.getElementById('catalog-count');
  if (count) count.textContent = `${catalogResults().length} alat ditampilkan`;
}

function renderKatalog() {
  const org = currentOrg();
  const source = catalogSource();
  catalogState = { query: '' };

  return `
    <div class="page page-wide">
      ${pageHead({
        kicker: 'Peminjam · UC-PJ-01',
        title: 'Katalog barang organisasi',
        lede: org ? `Alat yang ditayangkan anggota dan aset bersama ${esc(org.name)}. Status berubah mengikuti persetujuan dan pengembalian.` : 'Pilih organisasi terlebih dahulu.',
        actions: `<a class="btn-primary" href="#/tambah-barang">Daftarkan alat</a><a class="btn-secondary" href="#/pinjaman-saya">Pinjaman saya</a>`
      })}

      <div class="toolbar">
        <div class="search-row">
          <label class="sr-only" for="catalog-search">Cari barang</label>
          <input class="form-input" id="catalog-search" type="search" placeholder="Cari nama alat atau kode barang" autocomplete="off">
        </div>
        <p class="tiny muted" id="catalog-count" aria-live="polite">${source.length} alat ditampilkan</p>
      </div>

      <div class="grid-auto" id="catalog-grid">${catalogGridHtml()}</div>
    </div>`;
}

function renderDetailBarang(params) {
  const item = params && params.id ? store.itemById(params.id) : null;
  if (!item) {
    return `<div class="page page-mid">${pageHead({ kicker: 'Rincian barang', title: 'Barang tidak ditemukan', lede: 'Tautan mungkin sudah berubah.' })}<div class="empty"><p class="empty-title">Data barang tidak tersedia</p><p class="empty-body">Kembali ke katalog dan pilih alat lain.</p><a class="btn-primary" href="#/katalog">Buka katalog</a></div></div>`;
  }

  const me = currentUser();
  const owner = item.ownerId ? store.userById(item.ownerId) : null;
  const isOwner = !!me && item.ownerId === me.id;
  const canEdit = isOwner || (isOrgAdmin() && item.orgId === (currentOrg() ? currentOrg().id : ''));
  const activeLoan = store.loansOfItem(item.id).find((loan) => loan.status === 'Aktif');
  const history = store.loansOfItem(item.id)
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 4);

  let action = '';
  if (item.status === 'Tersedia' && !isOwner) {
    action = `<a class="btn-primary" href="#/form-pengajuan?id=${esc(item.id)}">Ajukan pinjaman</a>`;
  } else if (item.status === 'Tersedia' && isOwner) {
    action = `<a class="btn-secondary" href="#/edit-barang?id=${esc(item.id)}">Ubah barang</a>`;
  } else if (item.status === 'Dipinjam') {
    action = `<p class="small muted">Sedang dipinjam${activeLoan ? ` sampai ${fmtDate(activeLoan.end)}` : ''}. Kembali ke katalog untuk melihat alat lain.</p>`;
  } else {
    action = `<p class="small muted">Barang sedang tidak ditayangkan.</p>`;
  }

  const contents = (item.contents || []).map((part) => `<li>${esc(part)}</li>`).join('');

  return `
    <div class="page page-wide">
      ${pageHead({
        kicker: 'Peminjam · FR-PJ-03',
        title: item.name,
        lede: `Kode barang ${esc(item.code)}`,
        actions: `${canEdit ? `<a class="btn-secondary" href="#/edit-barang?id=${esc(item.id)}">Ubah barang</a>` : ''}<a class="btn-secondary" href="#/katalog">Kembali ke katalog</a>`
      })}

      <div class="detail-grid">
        <div class="stack">
          <div class="photo-frame detail-photo">
            <img src="${esc(item.image)}" alt="${esc(item.name)}" onerror="this.src='img/placeholder-item.svg'">
            <span class="photo-badge">${tag(item.status)}</span>
          </div>
          <div class="panel panel-pad">
            <h2 style="font-size:1rem;margin-bottom:.6rem">Kelengkapan yang dipinjam</h2>
            <ul class="small">${contents || '<li>Tidak ada daftar kelengkapan.</li>'}</ul>
          </div>
        </div>

        <div class="stack">
          <div class="panel panel-pad">
            <div class="item-head">
              <div>
                <h2 style="font-size:1.3rem">${esc(item.name)}</h2>
              </div>
              ${tag(item.status)}
            </div>
            <p class="small">${esc(item.description)}</p>

            <dl class="definition-list" style="margin-top:1.25rem">
              <div><dt>Pemilik</dt><dd>${owner ? `<a class="link" href="${waHref(owner.wa)}" target="_blank" rel="noopener">${esc(owner.name)}</a>` : 'Aset bersama organisasi'}</dd></div>
              <div><dt>Lokasi pengambilan</dt><dd>${esc(item.location)}</dd></div>
              <div><dt>Maksimal pinjam</dt><dd>${item.maxDays} hari</dd></div>
              <div><dt>Kode barang</dt><dd class="mono">${esc(item.code)}</dd></div>
            </dl>

            <hr class="divider">
            <div class="btn-row">${action}</div>
          </div>

          <div class="panel panel-pad">
            <h2 style="font-size:1rem;margin-bottom:.5rem">Ketentuan peminjaman</h2>
            <ul class="small stack-xs">
              <li>Pengajuan diperiksa pemilik atau pengurus organisasi.</li>
              <li>Pinjam paling lama ${item.maxDays} hari sejak tanggal mulai.</li>
              <li>Pengembalian dikonfirmasi pemilik setelah alat diperiksa.</li>
              <li>${esc(item.instructions)}</li>
            </ul>
          </div>
        </div>
      </div>

      ${history.length ? `<section class="section-rule">
        <div class="section-head"><h2>Riwayat pinjaman terakhir</h2><p>Catatan ini membantu pemilik dan pengurus melihat kondisi alat.</p></div>
        <div class="list">${history.map((loan) => {
          const borrower = store.userById(loan.borrowerId);
          return `<div class="list-item row"><div><span class="cell-main">${esc(borrower ? borrower.name : 'Anggota')}</span><span class="cell-sub">${fmtDate(loan.start)} – ${fmtDate(loan.end)} · ${loan.status === 'Aktif' && isOverdue(loan) ? 'Terlambat' : esc(loan.status)}</span></div><div class="actions"><button class="btn-secondary btn-sm" type="button" data-action="open-loan" data-id="${esc(loan.id)}">Rincian</button></div></div>`;
        }).join('')}</div>
      </section>` : ''}
    </div>`;
}

function loanSummaryHtml(item) {
  if (!item) return '';
  const owner = item.ownerId ? store.userById(item.ownerId) : null;
  return `
    <img class="detail-photo" src="${esc(item.image)}" alt="" style="aspect-ratio:16/9;width:100%;object-fit:cover;margin-bottom:.8rem" onerror="this.src='img/placeholder-item.svg'">
    <h2 style="font-size:1.05rem">${esc(item.name)}</h2>
    <dl class="definition-list" style="margin-top:.9rem">
      <div><dt>Pemilik</dt><dd>${esc(owner ? owner.name : 'Aset organisasi')}</dd></div>
      <div><dt>Maksimal pinjam</dt><dd>${item.maxDays} hari</dd></div>
      <div><dt>Lokasi</dt><dd>${esc(item.location)}</dd></div>
    </dl>`;
}

function renderFormPengajuan(params) {
  const me = currentUser();
  const org = currentOrg();
  if (!me || !org) return emptyPage('Formulir pengajuan', 'Masuk sebagai anggota organisasi untuk mengajukan pinjaman.');

  const eligible = store.itemsOf(org.id).filter((item) => {
    if (item.status !== 'Tersedia' || item.ownerId === me.id) return false;
    return !store.db.loans.some((loan) => loan.itemId === item.id && loan.borrowerId === me.id && loan.status === 'Menunggu');
  });

  if (!eligible.length) {
    return `<div class="page page-mid">${pageHead({ kicker: 'Peminjam · UC-PJ-02', title: 'Formulir pengajuan pinjaman' })}<div class="empty"><p class="empty-title">Belum ada alat yang bisa diajukan</p><p class="empty-body">Semua alat sedang dipinjam, atau Anda sudah punya pengajuan menunggu untuk alat tersebut.</p><a class="btn-primary" href="#/katalog">Kembali ke katalog</a></div></div>`;
  }

  const requested = params && params.id ? eligible.find((item) => item.id === params.id) : null;
  const item = requested || eligible[0];
  const start = addDaysISO(todayISO(), 1);
  const end = addDaysISO(start, Math.max(0, item.maxDays - 1));

  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Peminjam · UC-PJ-02',
        title: 'Formulir pengajuan pinjaman',
        lede: 'Isi tanggal dan keperluan. Pemilik atau pengurus akan menyetujui dari daftar permintaan.'
      })}

      <div class="grid-2">
        <div class="panel panel-pad">
          <form data-form="loan" novalidate>
            <div class="field">
              <label class="label" for="loan-item">Alat yang diajukan</label>
              <select class="form-input" id="loan-item" name="item" required>
                ${eligible.map((option) => `<option value="${esc(option.id)}" ${option.id === item.id ? 'selected' : ''}>${esc(option.name)} · maks. ${option.maxDays} hari</option>`).join('')}
              </select>
            </div>
            <div class="form-grid two">
              <div class="field">
                <label class="label" for="loan-start">Tanggal mulai</label>
                <input class="form-input" id="loan-start" name="start" type="date" min="${todayISO()}" value="${start}" required>
              </div>
              <div class="field">
                <label class="label" for="loan-end">Tanggal kembali</label>
                <input class="form-input" id="loan-end" name="end" type="date" min="${start}" value="${end}" required>
              </div>
            </div>
            <div class="field">
              <label class="label" for="loan-purpose">Keperluan peminjaman</label>
              <textarea class="form-input" id="loan-purpose" name="purpose" rows="4" placeholder="Contoh: memperbaiki kusen pintu kamar sebelum akhir bulan." required></textarea>
              <p class="hint">Tuliskan rencana pemakaian secara singkat agar pemilik mudah menilai.</p>
            </div>
            <label class="checkbox field">
              <input type="checkbox" name="agree" required>
              <span>Saya sudah membaca ketentuan peminjaman dan akan mengembalikan alat sesuai tanggal yang disetujui.</span>
            </label>
            <button class="btn-primary btn-block form-submit" type="submit">Kirim pengajuan</button>
          </form>
          <p class="hint" style="margin-top:.75rem">Pengajuan bisa dibatalkan selama masih berstatus menunggu.</p>
        </div>

        <div class="panel panel-pad" id="loan-summary">${loanSummaryHtml(item)}</div>
      </div>
    </div>`;
}

function loanCard(loan) {
  const item = store.itemById(loan.itemId);
  const owner = loan.ownerId ? store.userById(loan.ownerId) : null;
  const display = loan.status === 'Aktif' && isOverdue(loan) ? 'Terlambat' : loan.status;
  if (!item) return '';
  return `
    <article class="list-item">
      <div class="item-head" style="margin-bottom:.65rem;padding-bottom:.65rem">
        <div>
          <span class="cell-main"><a href="#/detail-barang?id=${esc(item.id)}">${esc(item.name)}</a></span>
          <span class="cell-sub">${esc(item.code)} · ${esc(owner ? owner.name : 'Aset organisasi')}</span>
        </div>
        ${tag(display)}
      </div>
      <dl class="definition-list">
        <div><dt>Tanggal pinjam</dt><dd>${fmtDate(loan.start)} – ${fmtDate(loan.end)}</dd></div>
        <div><dt>Keperluan</dt><dd>${esc(loan.purpose)}</dd></div>
      </dl>
      <div class="actions">${loanActionButtons(loan)}</div>
    </article>`;
}

function loanActionButtons(loan) {
  const me = currentUser();
  const ownerOrAdmin = isOrgAdmin() || (!!me && loan.ownerId === me.id);
  const buttons = [`<button class="btn-secondary btn-sm" type="button" data-action="open-loan" data-id="${esc(loan.id)}">Rincian transaksi</button>`];
  if (loan.status === 'Menunggu' && ownerOrAdmin) {
    buttons.push(`<button class="btn-primary btn-sm" type="button" data-action="approve-loan" data-id="${esc(loan.id)}">Setujui</button>`);
    buttons.push(`<button class="btn-danger btn-sm" type="button" data-action="reject-loan" data-id="${esc(loan.id)}">Tolak</button>`);
  }
  if (loan.status === 'Menunggu' && me && loan.borrowerId === me.id) {
    buttons.push(`<button class="btn-danger btn-sm" type="button" data-action="cancel-loan" data-id="${esc(loan.id)}">Batalkan</button>`);
  }
  if (loan.status === 'Aktif' && ownerOrAdmin) {
    buttons.push(`<button class="btn-primary btn-sm" type="button" data-action="return-loan" data-id="${esc(loan.id)}">Konfirmasi kembali</button>`);
  }
  return buttons.join('');
}

function loanListHtml(loans) {
  if (!loans.length) {
    return `<div class="empty"><p class="empty-title">Belum ada pinjaman di filter ini</p><p class="empty-body">Pengajuan yang Anda kirim akan muncul di sini beserta statusnya.</p><a class="btn-primary" href="#/katalog">Cari alat</a></div>`;
  }
  return `<div class="list">${loans.map(loanCard).join('')}</div>`;
}

function filteredBorrowerLoans() {
  const me = currentUser();
  const org = currentOrg();
  if (!me || !org) return [];
  const loans = store.loansOfBorrower(me.id)
    .filter((loan) => loan.orgId === org.id)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return loanTab === 'Semua' ? loans : loans.filter((loan) => loan.status === loanTab);
}

function refreshLoanList() {
  const container = document.getElementById('loan-list');
  if (!container) return;
  container.innerHTML = loanListHtml(filteredBorrowerLoans());
  document.querySelectorAll('[data-loan-tab]').forEach((button) => {
    button.setAttribute('aria-selected', String(button.dataset.loanTab === loanTab));
  });
}

function renderPinjamanSaya() {
  const me = currentUser();
  const org = currentOrg();
  if (!me || !org) return emptyPage('Pinjaman saya', 'Masuk sebagai anggota untuk melihat pinjaman.');

  loanTab = 'Semua';
  const all = store.loansOfBorrower(me.id).filter((loan) => loan.orgId === org.id);
  const counts = {
    Menunggu: all.filter((loan) => loan.status === 'Menunggu').length,
    Aktif: all.filter((loan) => loan.status === 'Aktif').length,
    Selesai: all.filter((loan) => loan.status === 'Selesai').length
  };

  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Peminjam · UC-PJ-04',
        title: 'Pinjaman saya',
        lede: 'Pantau pengajuan yang menunggu, pinjaman berjalan, dan riwayat yang sudah selesai.',
        actions: `<a class="btn-primary" href="#/katalog">Cari alat</a>`
      })}

      <div class="stat-strip">
        <div class="stat"><span class="stat-value">${counts.Menunggu}</span><span class="stat-label">Menunggu persetujuan</span></div>
        <div class="stat"><span class="stat-value">${counts.Aktif}</span><span class="stat-label">Sedang dipinjam</span></div>
        <div class="stat"><span class="stat-value">${counts.Selesai}</span><span class="stat-label">Selesai</span></div>
      </div>

      <div class="tabs" role="tablist" aria-label="Filter status pinjaman">
        ${['Semua', 'Menunggu', 'Aktif', 'Selesai'].map((status) => `<button class="tab" type="button" role="tab" data-loan-tab="${status}" aria-selected="${status === 'Semua'}">${status}</button>`).join('')}
      </div>

      <div id="loan-list">${loanListHtml(filteredBorrowerLoans())}</div>
    </div>`;
}

function myItemCard(item) {
  const loans = store.loansOfItem(item.id);
  const active = loans.filter((loan) => loan.status === 'Aktif').length;
  const pending = loans.filter((loan) => loan.status === 'Menunggu').length;
  return `
    <article class="list-item">
      <div class="item-head" style="margin-bottom:.65rem;padding-bottom:.65rem">
        <div>
          <span class="cell-main"><a href="#/detail-barang?id=${esc(item.id)}">${esc(item.name)}</a></span>
          <span class="cell-sub">Kode barang: ${esc(item.code)}</span>
        </div>
        ${tag(item.status)}
      </div>
      <p class="small muted">${esc(item.description)}</p>
      <p class="tiny muted">${pending} permintaan menunggu · ${active} sedang dipinjam</p>
      <div class="actions">
        <a class="btn-secondary btn-sm" href="#/edit-barang?id=${esc(item.id)}">Ubah</a>
        ${item.status === 'Diarsipkan'
          ? `<button class="btn-secondary btn-sm" type="button" data-action="restore-item" data-id="${esc(item.id)}">Tayangkan lagi</button>`
          : `<button class="btn-danger btn-sm" type="button" data-action="archive-item" data-id="${esc(item.id)}">Tarik dari katalog</button>`}
      </div>
    </article>`;
}

function incomingRequestCard(loan) {
  const item = store.itemById(loan.itemId);
  const borrower = store.userById(loan.borrowerId);
  if (!item) return '';
  return `
    <article class="list-item">
      <div class="item-head" style="margin-bottom:.65rem;padding-bottom:.65rem">
        <div>
          <span class="cell-main">${esc(borrower ? borrower.name : 'Anggota')}</span>
          <span class="cell-sub">${esc(item.name)} · ${fmtDate(loan.start)} – ${fmtDate(loan.end)}</span>
        </div>
        ${tag(loan.status === 'Aktif' && isOverdue(loan) ? 'Terlambat' : loan.status)}
      </div>
      <p class="small muted">${esc(loan.purpose)}</p>
      <div class="actions">${loanActionButtons(loan)}</div>
    </article>`;
}

function renderBarangSaya() {
  const me = currentUser();
  const org = currentOrg();
  if (!me || !org) return emptyPage('Barang saya', 'Masuk sebagai anggota untuk melihat barang Anda.');

  const items = store.itemsByOwner(me.id).filter((item) => item.orgId === org.id);
  const requests = store.db.loans
    .filter((loan) => loan.orgId === org.id && loan.ownerId === me.id && (loan.status === 'Menunggu' || loan.status === 'Aktif'))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Pemilik · UC-PM-01',
        title: 'Barang saya dan permintaan masuk',
        lede: 'Setujui permintaan pinjaman dan konfirmasi pengembalian tanpa mencari pesan lama.',
        actions: `<a class="btn-primary" href="#/tambah-barang">Daftarkan barang</a>`
      })}

      <div class="stat-strip">
        <div class="stat"><span class="stat-value">${items.length}</span><span class="stat-label">Barang terdaftar</span></div>
        <div class="stat"><span class="stat-value">${items.filter((item) => item.status === 'Tersedia').length}</span><span class="stat-label">Tersedia</span></div>
        <div class="stat"><span class="stat-value">${requests.filter((loan) => loan.status === 'Menunggu').length}</span><span class="stat-label">Permintaan baru</span></div>
      </div>

      <section>
        <div class="section-head"><h2>Permintaan masuk</h2><p>Pengajuan untuk barang yang Anda miliki.</p></div>
        ${requests.length ? `<div class="list">${requests.map(incomingRequestCard).join('')}</div>` : emptyState('Tidak ada permintaan aktif', 'Permintaan baru akan muncul di sini setelah anggota mengajukan pinjaman.', '')}
      </section>

      <section class="section-rule">
        <div class="section-head"><h2>Daftar barang</h2><p>Barang yang Anda tayangkan di katalog organisasi.</p></div>
        ${items.length ? `<div class="list">${items.map(myItemCard).join('')}</div>` : emptyState('Belum ada barang', 'Daftarkan alat yang layak dipakai bersama. Anda tetap pemiliknya dan menentukan persetujuan pinjaman.', '<a class="btn-primary" href="#/tambah-barang">Daftarkan barang</a>')}
      </section>
    </div>`;
}

function itemForm(item, mode) {
  const me = currentUser();
  const imageOptions = IMAGE_OPTIONS.map(([value, label]) => `<option value="${esc(value)}" ${value === item.image ? 'selected' : ''}>${esc(label)}</option>`).join('');
  return `
    <form data-form="${mode === 'add' ? 'add-item' : 'edit-item'}" novalidate>
      ${mode === 'edit' ? `<input type="hidden" name="id" value="${esc(item.id)}">` : ''}
      <div class="field">
        <label class="label" for="item-name">Nama barang</label>
        <input class="form-input" id="item-name" name="name" value="${esc(item.name)}" required>
        <p class="hint">Tulis merek dan ukuran bila penting, misalnya "Bor listrik impact 13 mm".</p>
      </div>
      <div class="field">
        <label class="label" for="item-days">Maksimal hari pinjam</label>
        <input class="form-input" id="item-days" name="maxDays" type="number" min="1" max="14" value="${esc(item.maxDays)}" required>
      </div>
      <div class="field">
        <label class="label" for="item-location">Lokasi pengambilan</label>
        <input class="form-input" id="item-location" name="location" value="${esc(item.location || (me ? me.address : ''))}" required>
      </div>
      <div class="field">
        <label class="label" for="item-description">Deskripsi singkat</label>
        <textarea class="form-input" id="item-description" name="description" rows="3" required>${esc(item.description)}</textarea>
      </div>
      <div class="field">
        <label class="label" for="item-contents">Kelengkapan</label>
        <textarea class="form-input" id="item-contents" name="contents" rows="4" placeholder="Satu item per baris">${esc((item.contents || []).join('\n'))}</textarea>
        <p class="hint">Satu baris untuk setiap bagian, misalnya "1 kabel pengisi daya".</p>
      </div>
      <div class="field">
        <label class="label" for="item-instructions">Catatan pemakaian</label>
        <textarea class="form-input" id="item-instructions" name="instructions" rows="3" required>${esc(item.instructions)}</textarea>
      </div>
      <div class="field">
        <label class="label" for="item-image">Foto contoh</label>
        <select class="form-input" id="item-image" name="image">${imageOptions}</select>
        <p class="hint">Demo memakai foto contoh. Unggahan foto asli belum disimpan di peramban.</p>
      </div>
      <button class="btn-primary btn-block form-submit" type="submit">${mode === 'add' ? 'Tayangkan barang' : 'Simpan perubahan'}</button>
    </form>`;
}

function renderTambahBarang() {
  const me = currentUser();
  if (!me) return emptyPage('Daftarkan barang', 'Masuk sebagai anggota untuk menayangkan barang.');
  const draft = {
    name: '', maxDays: 3, location: me.address,
    description: '', contents: [], instructions: '', image: 'img/placeholder-item.svg'
  };
  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Pemilik · UC-PM-02',
        title: 'Daftarkan barang baru',
        lede: 'Barang tetap milik Anda. Anggota lain mengajukan pinjaman, dan Anda yang menyetujui.',
        actions: `<a class="btn-secondary" href="#/barang-saya">Kembali ke barang saya</a>`
      })}
      <div class="panel panel-pad">${itemForm(draft, 'add')}</div>
    </div>`;
}

function renderEditBarang(params) {
  const me = currentUser();
  const item = params && params.id ? store.itemById(params.id) : null;
  if (!item) {
    return `<div class="page page-mid">${pageHead({ kicker: 'Ubah barang', title: 'Barang tidak ditemukan' })}<div class="empty"><p class="empty-title">Tautan tidak valid</p><a class="btn-primary" href="#/barang-saya">Kembali ke barang saya</a></div></div>`;
  }
  const isOwner = !!me && item.ownerId === me.id;
  if (!isOwner && !isOrgAdmin()) {
    return restrictedBlock('Ubah barang', 'Hanya pemilik barang atau pengurus organisasi yang bisa mengubah data ini.');
  }

  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Pemilik · UC-PM-03',
        title: 'Ubah data barang',
        lede: `${esc(item.name)} · ${esc(item.code)}`,
        actions: `<a class="btn-secondary" href="#/detail-barang?id=${esc(item.id)}">Lihat rincian</a><a class="btn-secondary" href="#/barang-saya">Barang saya</a>`
      })}
      <div class="panel panel-pad">${itemForm(item, 'edit')}</div>
      <div class="well" style="margin-top:1rem">
        <p class="small strong">Menarik barang dari katalog</p>
        <p class="small muted" style="margin-top:.25rem">Barang yang sedang dipinjam tidak bisa ditarik. Setelah dikembalikan, Anda bisa menariknya sementara.</p>
        <div class="btn-row" style="margin-top:.6rem">
          ${item.status === 'Diarsipkan'
            ? `<button class="btn-secondary" type="button" data-action="restore-item" data-id="${esc(item.id)}">Tayangkan lagi</button>`
            : `<button class="btn-danger" type="button" data-action="archive-item" data-id="${esc(item.id)}">Tarik dari katalog</button>`}
        </div>
      </div>
    </div>`;
}

function renderStruktur() {
  const org = currentOrg();
  if (!org) return emptyPage('Struktur organisasi', 'Pilih organisasi terlebih dahulu.');
  const members = store.activeMembersOf(org.id).slice().sort(sortMembers);
  const announcements = store.announcementsOf(org.id).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 2);

  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Organisasi',
        title: `Struktur ${org.name}`,
        lede: `${esc(org.type)} · ${esc(org.address)}`,
        actions: isOrgAdmin() ? `<a class="btn-primary" href="#/admin-bagan">Ubah bagan</a><a class="btn-secondary" href="#/admin-anggota">Kelola anggota</a>` : ''
      })}

      <div class="structure-list">
        ${members.length ? members.map((m) => {
          const user = store.userById(m.userId);
          if (!user) return '';
          return `<div class="structure-row">
            <span class="structure-position">${esc(m.position || m.role)}</span>
            <span class="structure-person">${esc(user.name)} <span class="tiny muted">${esc(m.role)}</span></span>
            <a class="link tiny" href="${waHref(user.wa)}" target="_blank" rel="noopener">WhatsApp</a>
          </div>`;
        }).join('') : `<div class="empty"><p class="empty-title">Belum ada anggota aktif</p><p class="empty-body">Pengurus dapat menambahkan anggota dari portal pengurus.</p></div>`}
      </div>

      ${isOrgAdmin() ? `<div class="invite-box" style="margin-top:1.25rem">
        <div><span class="tiny strong">Kode undangan</span><div class="invite-code">${esc(org.inviteCode)}</div><span class="tiny muted">Berlaku sampai ${fmtDate(org.inviteExpires)}</span></div>
        <div class="actions"><button class="btn-secondary btn-sm" type="button" data-action="copy-invite" data-code="${esc(org.inviteCode)}">Salin kode</button><a class="btn-secondary btn-sm" href="#/admin-organisasi">Atur undangan</a></div>
      </div>` : ''}

      <section class="section-rule">
        <div class="section-head"><h2>Pengumuman terbaru</h2><p>Informasi dari pengurus organisasi.</p></div>
        ${announcements.length ? announcements.map((item) => {
          const author = store.userById(item.authorId);
          return `<div class="announcement"><div class="announcement-head"><strong>${esc(item.title)}</strong><span>${fmtDate(item.createdAt)} · ${esc(author ? author.name : 'Pengurus')}</span></div><p>${esc(item.body)}</p></div>`;
        }).join('') : '<p class="small muted">Belum ada pengumuman.</p>'}
        <div class="btn-row" style="margin-top:.75rem"><a class="btn-secondary" href="#/pengumuman">Lihat semua pengumuman</a></div>
      </section>
    </div>`;
}

function renderPengumuman() {
  const org = currentOrg();
  if (!org) return emptyPage('Pengumuman', 'Pilih organisasi terlebih dahulu.');
  const announcements = store.announcementsOf(org.id).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Organisasi',
        title: 'Pengumuman',
        lede: `Informasi pengurus untuk anggota ${esc(org.name)}.`,
        actions: `<a class="btn-secondary" href="#/struktur">Struktur organisasi</a>`
      })}

      ${isOrgAdmin() ? `<div class="panel panel-pad" style="margin-bottom:1.25rem">
        <h2 style="font-size:1rem;margin-bottom:.6rem">Buat pengumuman</h2>
        <form data-form="announcement" novalidate>
          <div class="field">
            <label class="label" for="announcement-title">Judul</label>
            <input class="form-input" id="announcement-title" name="title" required>
          </div>
          <div class="field">
            <label class="label" for="announcement-body">Isi</label>
            <textarea class="form-input" id="announcement-body" name="body" rows="4" required></textarea>
          </div>
          <button class="btn-primary form-submit" type="submit">Kirim pengumuman</button>
        </form>
      </div>` : ''}

      ${announcements.length ? `<div class="panel panel-pad">${announcements.map((item) => {
        const author = store.userById(item.authorId);
        return `<div class="announcement">
          <div class="announcement-head"><strong>${esc(item.title)}</strong><span>${fmtDate(item.createdAt)} · ${esc(author ? author.name : 'Pengurus')}</span></div>
          <p>${esc(item.body)}</p>
          ${isOrgAdmin() ? `<div class="actions" style="margin-top:.5rem"><button class="btn-danger btn-sm" type="button" data-action="delete-announcement" data-id="${esc(item.id)}">Hapus</button></div>` : ''}
        </div>`;
      }).join('')}</div>` : `<div class="empty"><p class="empty-title">Belum ada pengumuman</p><p class="empty-body">Pengurus dapat mengirim jadwal pengecekan alat atau kebijakan hari libur.</p></div>`}
    </div>`;
}

function renderProfil() {
  const me = currentUser();
  if (!me) return emptyPage('Profil', 'Masuk untuk melihat profil.');
  const memberships = store.membershipsOfUser(me.id);

  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Akun · FR-UM-04',
        title: 'Profil dan keamanan akun',
        lede: 'Data keanggotaan dan kata sandi Anda.',
        actions: `<a class="btn-secondary" href="#/status-akun">Status akun</a>`
      })}

      <div class="grid-2">
        <div class="panel panel-pad">
          <div class="member-cell" style="margin-bottom:1rem">
            <span class="avatar" aria-hidden="true">${initials(me.name)}</span>
            <div><span class="cell-main">${esc(me.name)}</span><span class="cell-sub">${esc(me.wa)}</span></div>
          </div>
          <dl class="profile-list">
            <div class="profile-row"><dt>Alamat</dt><dd>${esc(me.address || '—')}</dd></div>
            <div class="profile-row"><dt>Status akun</dt><dd>${tag(me.status)}</dd></div>
            <div class="profile-row"><dt>Terdaftar sejak</dt><dd>${fmtDate(me.createdAt)}</dd></div>
            <div class="profile-row"><dt>Akses platform</dt><dd>${me.platformAdmin ? 'Admin platform' : 'Anggota'}</dd></div>
          </dl>
          <div class="btn-row" style="margin-top:1rem"><button class="btn-secondary" type="button" data-action="logout">Keluar dari akun</button></div>
        </div>

        <div class="panel panel-pad">
          <h2 style="font-size:1rem;margin-bottom:.6rem">Ubah kata sandi</h2>
          <form data-form="password" novalidate>
            <div class="field">
              <label class="label" for="pwd-current">Kata sandi saat ini</label>
              <input class="form-input" id="pwd-current" name="current" type="password" autocomplete="current-password" required>
            </div>
            <div class="field">
              <label class="label" for="pwd-new">Kata sandi baru</label>
              <input class="form-input" id="pwd-new" name="next" type="password" autocomplete="new-password" minlength="6" required>
            </div>
            <div class="field">
              <label class="label" for="pwd-confirm">Ulangi kata sandi baru</label>
              <input class="form-input" id="pwd-confirm" name="confirm" type="password" autocomplete="new-password" minlength="6" required>
            </div>
            <button class="btn-primary form-submit" type="submit">Simpan kata sandi</button>
          </form>
        </div>
      </div>

      <section class="section-rule">
        <div class="section-head"><h2>Keanggotaan organisasi</h2><p>Satu akun dapat terhubung ke beberapa organisasi dengan peran berbeda.</p></div>
        <div class="list">
          ${memberships.map((m) => {
            const org = store.orgById(m.orgId);
            if (!org) return '';
            return `<div class="list-item row">
              <div>
                <span class="cell-main">${esc(org.name)}</span>
                <span class="cell-sub">${esc(m.role)} · ${esc(m.position)} · sejak ${fmtDate(m.joinedAt)}</span>
              </div>
              <div class="actions">${tag(m.status)}${m.status === 'Aktif' ? `<button class="btn-secondary btn-sm" type="button" data-action="open-org" data-org="${esc(org.id)}">Buka</button>` : ''}</div>
            </div>`;
          }).join('') || '<p class="small muted">Belum ada keanggotaan.</p>'}
        </div>
        <div class="btn-row" style="margin-top:.75rem"><a class="btn-secondary" href="#/gabung">Gabung organisasi lain</a></div>
      </section>
    </div>`;
}
