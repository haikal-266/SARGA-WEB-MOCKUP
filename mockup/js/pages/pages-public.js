/**
 * Public and account screens: landing, login, registration, account status, and joining an organisation.
 * Loaded before app.js. Helpers come from app.js at call time.
 */

function boardItem(item) {
  return `
    <a class="board-item" href="#/detail-barang?id=${esc(item.id)}">
      <img class="board-thumb" src="${esc(item.image)}" alt="" loading="lazy" onerror="this.src='img/placeholder-item.svg'">
      <span>
        <strong>${esc(item.name)}</strong>
        <span>Maksimal ${item.maxDays} hari pinjam</span>
      </span>
    </a>`;
}

function renderBeranda() {
  const user = currentUser();
  const org = currentOrg();
  const available = (org ? store.itemsOf(org.id) : store.db.items)
    .filter((item) => item.status === 'Tersedia')
    .slice(0, 4);
  const boardTitle = org ? `Tersedia di ${esc(org.name)}` : 'Contoh alat di jaringan SARGA';
  const firstName = user ? user.name.split(' ')[0] : '';

  return `
    <div class="page page-wide">
      <section class="hero">
        <div>
          <p class="kicker">Inventaris bersama</p>
          <h1>Alat bersama organisasi, tercatat sampai kembali.</h1>
          <p class="lede">Grup chat tenggelam, catatan pinjaman hilang. SARGA menyatukan katalog alat, pengajuan pinjaman, persetujuan pemilik, dan riwayat serah terima dalam satu halaman yang bisa dibaca semua anggota.</p>
          <div class="hero-actions">
            <a class="btn-primary" href="${user ? '#/katalog' : '#/daftar'}">${user ? 'Buka katalog alat' : 'Daftar sebagai anggota'}</a>
            <a class="btn-secondary" href="${user ? '#/gabung' : '#/login'}">${user ? 'Gabung organisasi lain' : 'Masuk ke akun'}</a>
          </div>
          <p class="hero-note">${user ? `Masuk sebagai ${esc(user.name)}${org ? ` di ${esc(org.name)}` : ''}.` : 'Data demo. Organisasi baru dibuat oleh admin, bukan lewat pendaftaran publik.'}</p>
        </div>

        <div class="hero-board" aria-label="Daftar alat yang tersedia">
          <div class="board-head">
            <strong>${boardTitle}</strong>
            <span>${available.length} alat</span>
          </div>
          ${available.length ? available.map(boardItem).join('') : emptyState('Belum ada alat tersedia', 'Pengurus atau anggota belum menayangkan alat di organisasi ini.', '')}
          <div class="board-foot">Status diperbarui setiap kali pinjaman disetujui atau barang dikembalikan.</div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Tiga langkah, tanpa tanya di grup</h2>
          <p>Alur yang sama dipakai semua organisasi: katalog, pengajuan, lalu serah terima.</p>
        </div>
        <ol class="steps">
          <li class="step">
            <span class="step-num">01</span>
            <div><strong>Cari alat yang tersedia</strong><p>Cari alat yang dibutuhkan, baca kelengkapan, dan lihat siapa pemiliknya.</p></div>
          </li>
          <li class="step">
            <span class="step-num">02</span>
            <div><strong>Ajukan tanggal dan keperluan</strong><p>Pemilik atau pengurus menyetujui dari daftar permintaan. Tidak perlu menebak siapa yang sudah membalas.</p></div>
          </li>
          <li class="step">
            <span class="step-num">03</span>
            <div><strong>Ambil, pakai, kembalikan</strong><p>Pemilik mengonfirmasi pengembalian. Status alat kembali tersedia dan riwayatnya tetap tersimpan.</p></div>
          </li>
        </ol>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Yang dicatat SARGA</h2>
          <p>Bukan sekadar daftar barang. Setiap perubahan punya jejak yang bisa diperiksa pengurus.</p>
        </div>
        <div class="feature-list">
          <div class="feature-row"><div class="feature-title">Ketersediaan alat</div><div class="feature-body">Status tersedia atau dipinjam, tanggal kembali, dan siapa yang sedang memegang.</div></div>
          <div class="feature-row"><div class="feature-title">Persetujuan pemilik</div><div class="feature-body">Permintaan masuk ke pemilik dan pengurus, lengkap dengan tanggal serta keperluan peminjaman.</div></div>
          <div class="feature-row"><div class="feature-title">Riwayat transaksi</div><div class="feature-body">Pengajuan, persetujuan, penolakan, dan pengembalian tercatat dengan waktu dan pelakunya.</div></div>
          <div class="feature-row"><div class="feature-title">Pengumuman pengurus</div><div class="feature-body">Jadwal pengecekan alat dan kebijakan hari libur tampil di halaman organisasi, bukan tertimbun chat.</div></div>
        </div>
      </section>

      <section class="cta-band">
        <div>
          <h2>${firstName ? `Siap meminjam, ${esc(firstName)}?` : 'Punya kode undangan dari pengurus?'}</h2>
          <p>${user ? 'Katalog dan pinjaman Anda ada di organisasi yang sedang aktif. Ganti organisasi dari header bila Anda menjadi anggota lebih dari satu.' : 'Minta kode undangan kepada pengurus organisasi. Setelah mendaftar, akun diperiksa dulu sebelum bisa meminjam.'}</p>
        </div>
        <div class="cta-actions btn-row">
          <a class="btn-primary" href="${user ? '#/katalog' : '#/daftar'}">${user ? 'Lihat katalog' : 'Mulai daftar'}</a>
          <a class="btn-secondary" href="${user ? '#/pinjaman-saya' : '#/status-akun'}">${user ? 'Pinjaman saya' : 'Cek status akun'}</a>
        </div>
      </section>
    </div>`;
}

function demoAccountRow(user) {
  const membership = primaryMembership(user.id);
  const org = membership ? store.orgById(membership.orgId) : null;
  const meta = membership
    ? `${membership.role}${org ? ' · ' + org.name : ''} · ${membership.status}`
    : 'Belum punya organisasi';
  return `
    <div class="demo-account">
      <div>
        <div class="demo-account-name">${esc(user.name)}</div>
        <div class="demo-account-meta">${esc(meta)}</div>
      </div>
      <button class="btn-secondary btn-sm" type="button" data-action="login-as" data-user="${esc(user.id)}">Masuk</button>
    </div>`;
}

function renderLogin() {
  const user = currentUser();
  const demoUsers = store.db.users
    .filter((item) => store.membershipsOfUser(item.id).length > 0)
    .slice(0, 6);

  return `
    <div class="page page-narrow">
      <div class="auth-card">
        <div class="auth-head">
          <img src="image.png" alt="">
          <h1>Masuk ke akun SARGA</h1>
          <p>Gunakan nomor WhatsApp yang tercatat pada data anggota organisasi.</p>
        </div>

        ${user ? `<div class="alert alert-info" style="margin-bottom:1rem"><strong>Anda sudah masuk</strong>Sebagai ${esc(user.name)}${currentOrg() ? ' di ' + esc(currentOrg().name) : ''}. <a class="link" href="#/beranda">Kembali ke beranda</a>.</div>` : ''}

        <form data-form="login" novalidate>
          <div class="field">
            <label class="label" for="login-wa">Nomor WhatsApp terdaftar</label>
            <input class="form-input" id="login-wa" name="wa" type="tel" inputmode="tel" autocomplete="tel" value="${user ? esc(user.wa) : '081298765432'}" required>
            <p class="hint">Contoh akun demo sudah terisi. Anda bisa menggantinya.</p>
          </div>
          <div class="field">
            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:1rem">
              <label class="label" for="login-password">Kata sandi</label>
              <button class="link" type="button" style="background:none;border:0;min-height:24px;padding:.35rem 0;font-size:.78rem" data-action="forgot-password">Lupa kata sandi?</button>
            </div>
            <input class="form-input" id="login-password" name="password" type="password" autocomplete="current-password" value="rahasia123" required>
          </div>
          <button class="btn-primary btn-block form-submit" type="submit">Masuk</button>
          <button class="btn-secondary btn-block form-submit" type="button" data-action="open-otp">Masuk dengan kode OTP</button>
        </form>

        <p class="hint" style="margin-top:1rem">Belum punya akun? <a class="link" href="#/daftar">Daftar dengan kode undangan pengurus</a>. Sudah mendaftar dan menunggu? <a class="link" href="#/status-akun">Lihat status akun</a>.</p>

        <div class="demo-accounts">
          <h2>Pilihan akun demo</h2>
          <p>Setiap akun menunjukkan keadaan yang berbeda: pengurus, admin organisasi, akun menunggu, dan akun ditolak.</p>
          ${demoUsers.map(demoAccountRow).join('')}
        </div>
      </div>
    </div>`;
}

function renderDaftar() {
  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Pendaftaran anggota · Alur Verifikasi',
        title: 'Daftar dengan kode undangan organisasi',
        lede: 'Masukkan kode undangan dari pengurus organisasi Anda. Setelah kode cocok, lengkapi data diri dan foto dokumen keanggotaan (KTP/KTA) sebagai acuan verifikasi pengurus.'
      })}

      <div class="grid-2">
        <div class="panel panel-pad">
          <form data-form="register" novalidate id="register-form">
            
            <!-- LANGKAH 1: KODE UNDANGAN -->
            <div class="field" style="border-bottom: 1px solid var(--color-rule-2); padding-bottom: 1.25rem; margin-bottom: 1.25rem;">
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem">
                <span class="tag tag-in" style="font-weight:700">Langkah 1</span>
                <label class="label" for="reg-invite" style="margin:0;font-size:.95rem">Masukkan kode undangan dari pengurus</label>
              </div>
              <input class="form-input mono" id="reg-invite" name="invite" placeholder="Contoh: GRAHA2026" autocomplete="off" required style="font-size:1.05rem;font-weight:700;letter-spacing:1px">
              
              <div style="margin-top:.6rem">
                <p class="tiny muted" style="margin-bottom:.35rem">Pilih contoh kode organisasi untuk demo langsung:</p>
                <div class="btn-row" style="gap:.35rem;flex-wrap:wrap">
                  <button class="btn-pill" type="button" data-action="quick-invite" data-code="GRAHA2026">GRAHA2026 (Komunitas Graha Indah)</button>
                  <button class="btn-pill" type="button" data-action="quick-invite" data-code="RT05-2026">RT05-2026 (RT 05 / RW 08 Sukamaju)</button>
                  <button class="btn-pill" type="button" data-action="quick-invite" data-code="NUSANTARA2026">NUSANTARA2026 (PT Nusantara Digital)</button>
                </div>
              </div>

              <div id="reg-invite-status" style="margin-top:.5rem"></div>
            </div>

            <!-- LANGKAH 2: FORMULIR DATA DIRI ACUAN VERIFIKASI -->
            <div id="reg-profile-section" class="form-section-locked" style="transition: opacity 0.25s ease">
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem">
                <span class="tag tag-neutral" style="font-weight:700">Langkah 2</span>
                <h3 style="font-size:1rem;margin:0">Formulir Data Diri Calon Anggota</h3>
              </div>
              <p class="tiny muted" style="margin-bottom:1rem">Data berikut menjadi acuan pengurus saat memverifikasi dan menyetujui pendaftaran Anda.</p>

              <div class="field">
                <label class="label" for="reg-name">Nama lengkap</label>
                <input class="form-input" id="reg-name" name="name" placeholder="Nama sesuai identitas resmi" autocomplete="name" required>
              </div>

              <div class="form-grid two">
                <div class="field">
                  <label class="label" for="reg-wa">Nomor HP / WhatsApp</label>
                  <input class="form-input" id="reg-wa" name="wa" type="tel" inputmode="tel" placeholder="081234567890" autocomplete="tel" required>
                  <p class="hint">Untuk masuk akun dan dihubungi pengurus.</p>
                </div>
                <div class="field">
                  <label class="label" for="reg-address">Alamat / Divisi / Unit</label>
                  <input class="form-input" id="reg-address" name="address" placeholder="Contoh: Blok E1 No. 15 / Divisi B">
                  <p class="hint">Alamat domisili atau bagian kerja.</p>
                </div>
              </div>

              <div class="field">
                <label class="label" for="reg-password">Kata sandi</label>
                <input class="form-input" id="reg-password" name="password" type="password" autocomplete="new-password" minlength="6" placeholder="Minimal 6 karakter" required>
              </div>

              <!-- DOKUMEN KEANGGOTAAN -->
              <div class="field" style="margin-top:1.25rem;border-top:1px dashed var(--color-rule-2);padding-top:1.25rem">
                <label class="label" for="reg-doc-type">Foto Dokumen Keanggotaan (Acuan Verifikasi Pengurus)</label>
                <p class="hint" style="margin-bottom:.5rem">Lampirkan foto KTP, Kartu Tanda Anggota (KTA), atau surat pengantar pengurus.</p>
                
                <div class="form-grid two" style="margin-bottom:.6rem">
                  <div>
                    <label class="label" for="reg-doc-type" style="font-size:.8rem;color:var(--color-muted)">Jenis Dokumen</label>
                    <select class="form-input" id="reg-doc-type" name="documentType">
                      <option value="KTP (Kartu Tanda Penduduk)">KTP (Kartu Tanda Penduduk)</option>
                      <option value="Kartu Tanda Anggota (KTA)">Kartu Tanda Anggota (KTA)</option>
                      <option value="Surat Keterangan Pengurus">Surat Keterangan Pengurus</option>
                      <option value="Dokumen Identitas Lainnya">Dokumen Identitas Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label class="label" for="reg-document" style="font-size:.8rem;color:var(--color-muted)">Unggah Foto Berkas</label>
                    <input class="form-input" id="reg-document" name="document" type="file" accept="image/*">
                  </div>
                </div>

                <div style="margin-bottom:.6rem">
                  <span class="tiny muted">Atau gunakan dokumen contoh demo:</span>
                  <div class="btn-row" style="margin-top:.25rem;gap:.4rem">
                    <button class="btn-secondary btn-sm" type="button" data-action="use-sample-ktp">Gunakan Contoh KTP Demo</button>
                    <button class="btn-secondary btn-sm" type="button" data-action="use-sample-kta">Gunakan Contoh KTA Demo</button>
                  </div>
                </div>

                <!-- Hidden inputs to hold image data and name -->
                <input type="hidden" id="reg-document-data" name="documentData" value="img/sample-ktp.svg">
                <input type="hidden" id="reg-document-name" name="documentName" value="KTP_Agus_Setiawan_Demo.svg">

                <!-- Pratinjau Gambar Dokumen -->
                <div id="reg-doc-preview-card" class="doc-preview-box">
                  <div class="doc-preview-header">
                    <span class="small strong">Pratinjau Foto Dokumen Verifikasi</span>
                    <span class="tag tag-in" id="reg-doc-status-tag">Dokumen Siap</span>
                  </div>
                  <div class="doc-preview-img-wrap">
                    <img id="reg-doc-preview-img" src="img/sample-ktp.svg" alt="Pratinjau Dokumen">
                  </div>
                  <p class="tiny muted" id="reg-doc-filename-display" style="margin-top:.4rem">Berkas: KTP_Agus_Setiawan_Demo.svg (Contoh KTP Demo)</p>
                </div>
              </div>

              <div class="field" style="margin-top:1rem">
                <label class="label" for="reg-doc-note">Catatan tambahan (opsional)</label>
                <input class="form-input" id="reg-doc-note" name="documentNote" placeholder="Contoh: Sudah konfirmasi ke Pak RT / Pengurus Divisi">
              </div>

              <button class="btn-primary btn-block form-submit" type="submit" id="reg-submit-btn" disabled style="margin-top:1.25rem">
                Kirim Pendaftaran & Dokumen Verifikasi
              </button>
            </div>
          </form>
          <p class="hint" style="margin-top:.75rem">Sudah punya akun? <a class="link" href="#/login">Masuk di sini</a>.</p>
        </div>

        <div class="stack">
          <div class="panel panel-pad">
            <h2 style="font-size:1rem;margin-bottom:.6rem">Alur Verifikasi Pendaftaran</h2>
            <ol class="timeline" style="margin:0">
              <li class="timeline-item done"><span class="timeline-dot"></span><div><strong>1. Masukkan Kode Pengurus</strong><p>Memastikan akun terhubung ke organisasi yang sah.</p></div></li>
              <li class="timeline-item current"><span class="timeline-dot"></span><div><strong>2. Isi Data Diri & Foto Dokumen</strong><p>Nama lengkap, nomor HP WhatsApp, dan foto KTP/KTA.</p></div></li>
              <li class="timeline-item"><span class="timeline-dot"></span><div><strong>3. Pemeriksaan Pengurus</strong><p>Pengurus memeriksa detail dan pop up foto dokumen di panel verifikasi.</p></div></li>
              <li class="timeline-item"><span class="timeline-dot"></span><div><strong>4. Akun Aktif</strong><p>Setelah disetujui, Anda langsung dapat meminjam alat dan perkakas komunal.</p></div></li>
            </ol>
          </div>
          <div class="well">
            <p class="small strong">Keamanan Data Organisasi</p>
            <p class="small muted" style="margin-top:.25rem">Dokumen verifikasi hanya dapat dilihat oleh Pengurus organisasi yang bersangkutan melalui panel verifikasi resmi SARGA.</p>
          </div>
        </div>
      </div>
    </div>`;
}

function signupTimeline(status) {
  const active = status === 'Aktif';
  const rejected = status === 'Ditolak';
  return `
    <ol class="timeline">
      <li class="timeline-item done"><span class="timeline-dot"></span><div><strong>Pendaftaran diterima</strong><p>Akun dan keanggotaan sudah tercatat.</p></div></li>
      <li class="timeline-item ${active ? 'done' : (rejected ? '' : 'current')}"><span class="timeline-dot"></span><div><strong>${rejected ? 'Pemeriksaan pengurus' : 'Pemeriksaan pengurus'}</strong><p>${rejected ? 'Pengurus menolak pendaftaran ini. Alasan dikirim ke WhatsApp pemohon.' : (active ? 'Pengurus menyetujui keanggotaan.' : 'Nomor WhatsApp dan dokumen sedang diperiksa pengurus.')}</p></div></li>
      <li class="timeline-item ${active ? 'done' : ''}"><span class="timeline-dot"></span><div><strong>Akun aktif</strong><p>${active ? 'Akun siap dipakai untuk meminjam dan menayangkan alat.' : 'Aktif setelah pengurus menyetujui pendaftaran.'}</p></div></li>
    </ol>`;
}

function renderStatusAkun() {
  const user = currentUser();
  if (!user) {
    return `<div class="page page-narrow">${pageHead({ kicker: 'Status akun', title: 'Masuk untuk melihat status', lede: 'Status pendaftaran terikat pada akun Anda.' })}<div class="panel panel-pad"><p class="small">Silakan <a class="link" href="#/login">masuk ke akun</a> terlebih dahulu.</p></div></div>`;
  }

  const memberships = store.membershipsOfUser(user.id);
  let membership = currentMembership();
  if (!membership && memberships.length) membership = memberships[0];
  const org = membership ? store.orgById(membership.orgId) : null;
  const status = membership ? membership.status : 'Tanpa organisasi';
  const documentName = user.documentName || '';

  let body = '';
  if (!membership) {
    body = `<div class="empty"><p class="empty-title">Akun belum terhubung ke organisasi</p><p class="empty-body">Minta kode undangan kepada pengurus, lalu gabung dari halaman organisasi.</p><a class="btn-primary" href="#/gabung">Gabung organisasi</a></div>`;
  } else if (status === 'Aktif') {
    body = `<div class="alert alert-success"><strong>Akun aktif</strong>Anda terdaftar sebagai ${esc(membership.role)} di ${esc(org.name)}. Anda bisa meminjam alat dan menayangkan barang sendiri.</div>
      ${signupTimeline(status)}
      <div class="btn-row"><a class="btn-primary" href="#/katalog">Buka katalog</a><a class="btn-secondary" href="#/profil">Lihat profil</a></div>`;
  } else if (status === 'Ditolak') {
    body = `<div class="alert alert-danger"><strong>Pendaftaran ditolak</strong>${esc(user.rejectionReason || 'Pengurus belum menuliskan alasan. Hubungi pengurus organisasi untuk keterangan lebih lanjut.')}</div>
      ${signupTimeline(status)}
      <div class="btn-row"><button class="btn-primary" type="button" data-action="resubmit-member" data-id="${esc(membership.id)}">Ajukan ulang</button><a class="btn-secondary" href="#/profil">Ganti akun</a></div>`;
  } else {
    body = `<div class="alert alert-warn"><strong>Menunggu verifikasi pengurus</strong>Pendaftaran Anda sudah masuk. Pengurus akan menghubungi nomor WhatsApp ${esc(user.wa)} setelah pemeriksaan selesai.</div>
      ${signupTimeline(status)}
      <p class="small muted">Pengurus organisasi: ${org ? `<a class="link" href="${waHref(org.contact)}" target="_blank" rel="noopener">${esc(org.contact)}</a>` : '—'}.</p>`;
  }

  return `
    <div class="page page-narrow">
      ${pageHead({
        kicker: 'Status akun',
        title: user.name,
        lede: org ? `Keanggotaan di ${org.name}.` : 'Belum ada organisasi aktif.'
      })}
      <div class="panel panel-pad">
        <div class="status-hero" style="border:0;padding:0">
          <div class="item-head">
            <div>
              <span class="cell-main">${esc(membership ? membership.role : 'Anggota')}</span>
              <span class="cell-sub">${esc(org ? org.name : 'Belum ada organisasi')} · ${esc(status)}</span>
            </div>
            ${membership ? tag(status) : ''}
          </div>
          ${body}
        </div>

        ${(documentName || user.documentImage) ? `
          <hr class="divider">
          <div class="doc-submitted-card">
            <h2 style="font-size:.95rem;margin-bottom:.4rem">Dokumen Acuan Verifikasi Pendaftaran</h2>
            <p class="small muted" style="margin-bottom:.65rem">Dokumen identitas ini diperiksa oleh pengurus organisasi.</p>
            <div class="doc-submitted-flex">
              <div class="doc-thumb-preview" style="cursor:default">
                <img src="${esc(user.documentImage || 'img/sample-ktp.svg')}" alt="Dokumen Anda" class="doc-thumb-img">
              </div>
              <div class="pending-card-content">
                <p class="small"><strong>Jenis Dokumen:</strong> ${esc(user.documentType || 'KTP / Identitas')}</p>
                <p class="small mono tiny muted"><strong>Berkas:</strong> ${esc(documentName || 'Dokumen_Keanggotaan.svg')}</p>
                ${user.documentNote ? `<p class="tiny muted" style="margin-top:.2rem">${esc(user.documentNote)}</p>` : ''}
                <div style="margin-top:.5rem">
                  <button class="btn-secondary btn-sm" type="button" data-action="view-my-doc">
                    👁️ Buka Pop-Up Pratinjau Dokumen
                  </button>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        ${memberships.length > 1 ? `<hr class="divider"><h2 style="font-size:.95rem;margin-bottom:.5rem">Keanggotaan lain</h2><div class="list">${memberships.map((m) => {
          const other = store.orgById(m.orgId);
          return `<div class="list-item row"><div><span class="cell-main">${esc(other.name)}</span><span class="cell-sub">${esc(m.role)} · ${esc(m.status)}</span></div><div class="actions"><button class="btn-secondary btn-sm" type="button" data-action="open-org" data-org="${esc(m.orgId)}">Buka</button></div></div>`;
        }).join('')}</div>` : ''}

        <hr class="divider">
        <div class="btn-row"><button class="btn-secondary" type="button" data-action="logout">Keluar dari akun</button></div>
      </div>
    </div>`;
}

function renderGabung() {
  const user = currentUser();
  if (!user) {
    return `<div class="page page-narrow">${pageHead({ kicker: 'Gabung organisasi', title: 'Masuk terlebih dahulu', lede: 'Keanggotaan terikat pada akun Anda.' })}<div class="panel panel-pad"><p class="small">Silakan <a class="link" href="#/login">masuk</a> atau <a class="link" href="#/daftar">daftar</a>.</p></div></div>`;
  }

  const memberships = store.membershipsOfUser(user.id);
  const cards = memberships.map((m) => {
    const org = store.orgById(m.orgId);
    return `<div class="list-item row">
      <div>
        <span class="cell-main">${esc(org.name)}</span>
        <span class="cell-sub">${esc(org.type)} · ${esc(m.role)} · sejak ${fmtDate(m.joinedAt)}</span>
      </div>
      <div class="actions">
        ${tag(m.status)}
        ${m.status === 'Aktif' ? `<button class="btn-secondary btn-sm" type="button" data-action="open-org" data-org="${esc(org.id)}">Buka</button>` : ''}
        ${m.status === 'Menunggu Verifikasi' ? `<button class="btn-secondary btn-sm" type="button" data-action="view-membership-doc" data-id="${esc(m.id)}">Lihat Dokumen</button>` : ''}
      </div>
    </div>`;
  }).join('');

  return `
    <div class="page page-mid">
      ${pageHead({
        kicker: 'Keanggotaan',
        title: 'Gabung organisasi lain',
        lede: 'Satu akun bisa menjadi anggota beberapa organisasi. Setiap organisasi punya katalog dan pengurus sendiri.'
      })}

      <div class="grid-2">
        <div class="panel panel-pad">
          <h2 style="font-size:1rem;margin-bottom:.5rem">Kode undangan</h2>
          <form data-form="join-org" novalidate>
            <div class="field">
              <label class="label" for="join-code">Kode dari pengurus</label>
              <input class="form-input mono" id="join-code" name="invite" autocomplete="off" placeholder="Misal: NUSANTARA2026" required>
              <p class="hint">Contoh demo: <span class="mono">NUSANTARA2026</span> atau <span class="mono">RT05-2026</span>.</p>
            </div>
            <button class="btn-primary btn-block form-submit" type="submit">Ajukan keanggotaan</button>
          </form>
          <p class="hint" style="margin-top:.75rem">Setelah memasukkan kode valid, popup <strong>Formulir Data Diri Calon Anggota</strong> akan terbuka untuk melampirkan foto bukti keanggotaan tanpa perlu memasukkan kata sandi.</p>
        </div>

        <div class="panel panel-pad">
          <h2 style="font-size:1rem;margin-bottom:.5rem">Organisasi Anda</h2>
          ${memberships.length ? `<div class="list">${cards}</div>` : emptyState('Belum ada organisasi', 'Gunakan kode undangan dari pengurus untuk bergabung.', '')}
        </div>
      </div>

      <div class="well" style="margin-top:1rem">
        <p class="small strong">Ingin membuat organisasi baru?</p>
        <p class="small muted" style="margin-top:.25rem">Pembuatan organisasi hanya tersedia untuk admin platform. Buka <a class="link" href="#/admin-direktori">direktori organisasi</a> bila akun Anda punya akses admin.</p>
      </div>
    </div>`;
}
