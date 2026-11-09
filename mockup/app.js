/**
 * SARGA mockup controller.
 * Screens render from data.js so the demo keeps one set of records.
 * Access checks here shape the prototype; real authorisation belongs on a server.
 */
'use strict';

const store = window.SARGA_DB;
const SESSION_KEY = 'sarga_session_v1';

const CATEGORIES = [
  'Pertukangan & perbaikan',
  'Perkakas tangan',
  'Kebun & halaman',
  'Kemping & luar ruangan',
  'Elektronik & kabel',
  'Aset bersama organisasi'
];

const ORG_TYPES = ['RT/RW', 'Komunitas', 'Kantor', 'Sekolah', 'Lainnya'];
const ROLE_OPTIONS = ['Org Admin', 'Pengurus', 'Anggota'];
const MEMBER_STATUSES = ['Aktif', 'Menunggu Verifikasi', 'Ditolak', 'Nonaktif'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const IMAGE_OPTIONS = [
  ['img/placeholder-item.svg', 'Belum ada foto'],
  ['img/obeng.jpg', 'Obeng dan mata obeng'],
  ['img/tangga.jpg', 'Tangga aluminium'],
  ['img/tenda.jpg', 'Tenda kemping'],
  ['img/ketam.jpg', 'Ketam kayu'],
  ['img/bubut.jpg', 'Mesin bubut kayu'],
  ['img/perkakas.jpg', 'Perkakas tangan'],
  ['img/mower.jpg', 'Mesin pemotong rumput'],
  ['img/projector.jpg', 'Proyektor portabel']
];

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (error) {
    console.warn('Sesi demo tidak bisa dibaca.', error);
  }
  return { userId: 'u-bambang', orgId: 'org-graha' };
}

let session = readSession();

function saveSession() {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Sesi demo tidak bisa disimpan.', error);
  }
}

function currentUser() {
  return session.userId ? store.userById(session.userId) || null : null;
}

function currentMembership() {
  const user = currentUser();
  if (!user) return null;
  if (session.orgId) {
    const direct = store.membership(user.id, session.orgId);
    if (direct) return direct;
  }
  const active = store.membershipsOfUser(user.id).find((entry) => entry.status === 'Aktif');
  return active || store.membershipsOfUser(user.id)[0] || null;
}

function currentOrg() {
  const membership = currentMembership();
  return membership ? store.orgById(membership.orgId) : null;
}

function primaryMembership(userId) {
  const memberships = store.membershipsOfUser(userId);
  return memberships.find((entry) => entry.status === 'Aktif') || memberships[0] || null;
}

function isOrgAdmin() {
  const membership = currentMembership();
  return !!membership && membership.status === 'Aktif' &&
    (membership.role === 'Org Admin' || membership.role === 'Pengurus');
}

function isPlatformAdmin() {
  const user = currentUser();
  return !!user && user.platformAdmin === true;
}

function hasActiveMembership() {
  const membership = currentMembership();
  const org = currentOrg();
  return !!membership && membership.status === 'Aktif' && !!org && org.status === 'Aktif';
}

/* ------------------------------------------------------------------ */
/* View state                                                          */
/* ------------------------------------------------------------------ */

let catalogState = { category: 'Semua', query: '' };
let loanTab = 'Semua';
let memberStatusFilter = 'Semua';
let memberQuery = '';
let adminLoanQuery = '';
let directoryQuery = '';

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tag(status) {
  const value = String(status || '');
  let tone = 'tag-neutral';
  if (value === 'Tersedia' || value === 'Aktif' || value === 'Selesai') tone = 'tag-in';
  else if (value === 'Dipinjam' || value === 'Nonaktif' || value === 'Diarsipkan') tone = 'tag-out';
  else if (value === 'Menunggu' || value === 'Menunggu Verifikasi') tone = 'tag-waiting';
  else if (value === 'Terlambat' || value === 'Ditolak' || value === 'Dibatalkan') tone = 'tag-danger';
  return `<span class="tag ${tone}">${esc(value)}</span>`;
}

function normalizeWa(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('62')) digits = '0' + digits.slice(2);
  return digits;
}

function waHref(value) {
  let digits = normalizeWa(value);
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  return `https://wa.me/${digits}`;
}

function userName(userId) {
  const user = store.userById(userId);
  return user ? user.name : 'Anggota';
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function todayISO() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDaysISO(value, days) {
  const date = parseDate(value);
  if (!date) return value;
  date.setDate(date.getDate() + Number(days || 0));
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function diffDays(start, end) {
  const a = parseDate(start);
  const b = parseDate(end);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000);
}

function fmtDate(value) {
  const date = parseDate(value);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function fmtDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fmtDate(value);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hours}.${minutes}`;
}

function isOverdue(loan) {
  if (!loan || loan.status !== 'Aktif') return false;
  const end = parseDate(loan.end);
  const today = parseDate(todayISO());
  return !!end && !!today && end < today;
}

function sortMembers(a, b) {
  const rank = { 'Org Admin': 0, Pengurus: 1, Anggota: 2 };
  const diff = (rank[a.role] ?? 3) - (rank[b.role] ?? 3);
  if (diff !== 0) return diff;
  return userName(a.userId).localeCompare(userName(b.userId), 'id');
}

function pageHead({ kicker, title, lede, actions }) {
  return `
    <div class="page-head">
      <div>
        ${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}
        <h1>${esc(title)}</h1>
        ${lede ? `<p class="lede">${esc(lede)}</p>` : ''}
      </div>
      ${actions ? `<div class="head-actions">${actions}</div>` : ''}
    </div>`;
}

function emptyState(title, body, action) {
  return `
    <div class="empty">
      <p class="empty-title">${esc(title)}</p>
      <p class="empty-body">${esc(body)}</p>
      ${action || ''}
    </div>`;
}

function emptyPage(title, body) {
  return `
    <div class="page page-mid">
      ${pageHead({ kicker: 'SARGA', title })}
      ${emptyState(title, body, '<a class="btn-primary" href="#/beranda">Kembali ke beranda</a>')}
    </div>`;
}

function restrictedBlock(title, body) {
  return `
    <div class="page page-mid">
      ${pageHead({ kicker: 'Akses terbatas', title })}
      <div class="alert alert-warn"><strong>Halaman ini tidak terbuka untuk akun Anda</strong>${esc(body)}</div>
      <div class="btn-row" style="margin-top:1rem">
        <a class="btn-primary" href="#/beranda">Kembali ke beranda</a>
        <a class="btn-secondary" href="#/login">Ganti akun demo</a>
      </div>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Toasts and dialogs                                                  */
/* ------------------------------------------------------------------ */

function toast(title, body, tone) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const node = document.createElement('div');
  const level = tone === 'danger' ? 'toast-danger' : tone === 'success' ? 'toast-success' : 'toast-info';
  const marks = {
    success: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5 10.5l3.3 3.3L15 7"/></svg>',
    danger: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 5.2v5.6"/><path d="M10 14.4v.1"/></svg>',
    info: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 9v5"/><path d="M10 5.8v.1"/></svg>'
  };
  node.className = `toast ${level}`;
  if (tone === 'danger') {
    node.setAttribute('role', 'alert');
    node.setAttribute('aria-atomic', 'true');
  }
  node.innerHTML = `
    <span class="toast-mark" aria-hidden="true">${marks[tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : 'info']}</span>
    <div class="toast-copy">
      <p class="toast-title">${esc(title)}</p>
      <p class="toast-message">${esc(body)}</p>
    </div>
    <button class="toast-close" type="button" aria-label="Tutup pemberitahuan">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>
    </button>`;
  container.appendChild(node);
  const timer = window.setTimeout(() => node.remove(), 5200);
  node.querySelector('.toast-close').addEventListener('click', () => {
    window.clearTimeout(timer);
    node.remove();
  });
}

let lastFocused = null;

function openModal(title, bodyHtml, wide) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  lastFocused = document.activeElement;
  root.innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-head">
          <h2 id="modal-title">${esc(title)}</h2>
          <button class="modal-close" type="button" data-action="close-modal" aria-label="Tutup dialog">×</button>
        </div>
        ${bodyHtml}
      </div>
    </div>`;
  document.body.classList.add('modal-open');
  const dialog = root.querySelector('.modal');
  const focusable = dialog.querySelector('textarea, input:not([type="hidden"]), select, button');
  if (focusable) focusable.focus();
  window.setTimeout(() => {
    const backdrop = root.querySelector('[data-modal-backdrop]');
    if (backdrop) {
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) closeModal();
      });
    }
  }, 0);
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = '';
  document.body.classList.remove('modal-open');
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  lastFocused = null;
}

function trapModalFocus(event) {
  if (event.key !== 'Tab') return;
  const dialog = document.querySelector('#modal-root .modal');
  if (!dialog) return;
  const items = Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea'))
    .filter((item) => item.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function formError(form, message, fieldName) {
  form.querySelectorAll('.error-text').forEach((node) => node.remove());
  form.querySelectorAll('[aria-invalid="true"]').forEach((node) => {
    node.removeAttribute('aria-invalid');
    node.removeAttribute('aria-describedby');
  });
  const field = fieldName ? form.elements.namedItem(fieldName) : null;
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    const error = document.createElement('p');
    error.className = 'error-text';
    error.id = `${fieldName}-error`;
    error.textContent = message;
    field.insertAdjacentElement('afterend', error);
    field.setAttribute('aria-describedby', error.id);
    if (typeof field.focus === 'function') field.focus();
  } else {
    const box = document.createElement('div');
    box.className = 'alert alert-danger form-error-summary';
    box.innerHTML = `<strong>Periksa isian</strong>${esc(message)}`;
    form.prepend(box);
  }
  toast('Periksa isian', message, 'danger');
}

/* ------------------------------------------------------------------ */
/* Navigation and routes                                               */
/* ------------------------------------------------------------------ */

const ROUTES = {
  '#/beranda': {
    title: 'SARGA: Inventaris dan Peminjaman Alat Organisasi',
    access: 'public',
    crumbs: [['Beranda']],
    render: () => renderBeranda()
  },
  '#/login': {
    title: 'Masuk akun · SARGA',
    access: 'public',
    crumbs: [['Beranda', '#/beranda'], ['Masuk akun']],
    render: () => renderLogin()
  },
  '#/daftar': {
    title: 'Daftar anggota · SARGA',
    access: 'public',
    crumbs: [['Beranda', '#/beranda'], ['Daftar anggota']],
    render: () => renderDaftar()
  },
  '#/status-akun': {
    title: 'Status pendaftaran · SARGA',
    access: 'auth',
    crumbs: [['Beranda', '#/beranda'], ['Status akun']],
    render: () => renderStatusAkun()
  },
  '#/gabung': {
    title: 'Gabung organisasi · SARGA',
    access: 'auth',
    crumbs: [['Beranda', '#/beranda'], ['Gabung organisasi']],
    render: () => renderGabung()
  },
  '#/katalog': {
    title: 'Katalog barang · SARGA',
    access: 'member',
    crumbs: [['Beranda', '#/beranda'], ['Katalog barang']],
    render: () => renderKatalog()
  },
  '#/detail-barang': {
    title: 'Rincian barang · SARGA',
    access: 'member',
    crumbs: [['Beranda', '#/beranda'], ['Katalog barang', '#/katalog'], ['Rincian barang']],
    render: (params) => renderDetailBarang(params)
  },
  '#/form-pengajuan': {
    title: 'Ajukan pinjaman · SARGA',
    access: 'member',
    crumbs: [['Beranda', '#/beranda'], ['Katalog barang', '#/katalog'], ['Ajukan pinjaman']],
    render: (params) => renderFormPengajuan(params)
  },
  '#/pinjaman-saya': {
    title: 'Pinjaman saya · SARGA',
    access: 'member',
    crumbs: [['Beranda', '#/beranda'], ['Pinjaman saya']],
    render: () => renderPinjamanSaya()
  },
  '#/barang-saya': {
    title: 'Barang saya · SARGA',
    access: 'member',
    crumbs: [['Beranda', '#/beranda'], ['Barang saya']],
    render: () => renderBarangSaya()
  },
  '#/tambah-barang': {
    title: 'Daftarkan barang · SARGA',
    access: 'member',
    crumbs: [['Beranda', '#/beranda'], ['Barang saya', '#/barang-saya'], ['Daftarkan barang']],
    render: () => renderTambahBarang()
  },
  '#/edit-barang': {
    title: 'Ubah barang · SARGA',
    access: 'member',
    crumbs: [['Beranda', '#/beranda'], ['Barang saya', '#/barang-saya'], ['Ubah barang']],
    render: (params) => renderEditBarang(params)
  },
  '#/struktur': {
    title: 'Struktur organisasi · SARGA',
    access: 'member',
    crumbs: [['Beranda', '#/beranda'], ['Struktur organisasi']],
    render: () => renderStruktur()
  },
  '#/pengumuman': {
    title: 'Pengumuman · SARGA',
    access: 'member',
    crumbs: [['Beranda', '#/beranda'], ['Pengumuman']],
    render: () => renderPengumuman()
  },
  '#/profil': {
    title: 'Profil dan keamanan · SARGA',
    access: 'auth',
    crumbs: [['Beranda', '#/beranda'], ['Profil']],
    render: () => renderProfil()
  },
  '#/admin-monitoring': {
    title: 'Monitoring sirkulasi · SARGA',
    access: 'admin',
    crumbs: [['Beranda', '#/beranda'], ['Pengurus', '#/admin-monitoring'], ['Monitoring']],
    render: () => renderAdminMonitoring()
  },
  '#/admin-verifikasi': {
    title: 'Verifikasi · SARGA',
    access: 'admin',
    crumbs: [['Beranda', '#/beranda'], ['Pengurus', '#/admin-monitoring'], ['Verifikasi']],
    render: () => renderAdminVerifikasi()
  },
  '#/admin-organisasi': {
    title: 'Kelola organisasi · SARGA',
    access: 'admin',
    crumbs: [['Beranda', '#/beranda'], ['Pengurus', '#/admin-monitoring'], ['Organisasi']],
    render: () => renderAdminOrganisasi()
  },
  '#/admin-direktori': {
    title: 'Direktori organisasi · SARGA',
    access: 'platform',
    crumbs: [['Beranda', '#/beranda'], ['Admin platform', '#/admin-direktori'], ['Direktori organisasi']],
    render: () => renderAdminDirektori()
  },
  '#/admin-buat-organisasi': {
    title: 'Buat organisasi · SARGA',
    access: 'platform',
    crumbs: [['Beranda', '#/beranda'], ['Direktori organisasi', '#/admin-direktori'], ['Buat organisasi']],
    render: () => renderAdminBuatOrganisasi()
  },
  '#/admin-anggota': {
    title: 'Anggota organisasi · SARGA',
    access: 'admin',
    crumbs: [['Beranda', '#/beranda'], ['Pengurus', '#/admin-monitoring'], ['Anggota']],
    render: () => renderAdminAnggota()
  },
  '#/admin-anggota-detail': {
    title: 'Rincian anggota · SARGA',
    access: 'admin',
    crumbs: [['Beranda', '#/beranda'], ['Anggota', '#/admin-anggota'], ['Rincian anggota']],
    render: (params) => renderAdminAnggotaDetail(params)
  },
  '#/admin-tambah-anggota': {
    title: 'Tambah anggota · SARGA',
    access: 'admin',
    crumbs: [['Beranda', '#/beranda'], ['Anggota', '#/admin-anggota'], ['Tambah anggota']],
    render: () => renderAdminTambahAnggota()
  },
  '#/admin-bagan': {
    title: 'Bagan dan peran · SARGA',
    access: 'admin',
    crumbs: [['Beranda', '#/beranda'], ['Pengurus', '#/admin-monitoring'], ['Bagan dan peran']],
    render: () => renderAdminBagan()
  }
};

const NOT_FOUND = {
  title: 'Halaman tidak ditemukan · SARGA',
  access: 'public',
  crumbs: [['Beranda', '#/beranda'], ['Halaman tidak ditemukan']],
  render: () => `
    <div class="page page-mid">
      ${pageHead({ kicker: '404', title: 'Halaman tidak ditemukan', lede: 'Alamat ini tidak ada di mockup SARGA.' })}
      ${emptyState('Tautan tidak dikenal', 'Periksa alamat, atau kembali ke beranda dan pilih halaman dari navigasi.', '<a class="btn-primary" href="#/beranda">Kembali ke beranda</a>')}
    </div>`
};

function parseHash() {
  const raw = window.location.hash || '#/beranda';
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart || '#/beranda';
  const params = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((value, key) => {
      params[key] = value;
    });
  }
  return { path, params, raw };
}

function navigate(hash) {
  if (window.location.hash === hash) {
    render();
    return;
  }
  window.location.hash = hash;
}

function navItems() {
  const user = currentUser();
  if (!user) {
    return [
      ['#/beranda', 'Beranda'],
      ['#/katalog', 'Katalog'],
      ['#/daftar', 'Daftar'],
      ['#/login', 'Masuk']
    ];
  }
  const items = [
    ['#/beranda', 'Beranda'],
    ['#/katalog', 'Katalog'],
    ['#/pinjaman-saya', 'Pinjaman saya'],
    ['#/barang-saya', 'Barang saya'],
    ['#/struktur', 'Struktur'],
    ['#/pengumuman', 'Pengumuman']
  ];
  if (isOrgAdmin()) items.push(['#/admin-monitoring', 'Pengurus']);
  if (isPlatformAdmin()) items.push(['#/admin-direktori', 'Direktori']);
  return items;
}

function isActiveLink(href, path) {
  if (href === '#/beranda') return path === '#/beranda';
  if (href === '#/admin-monitoring') {
    return path.startsWith('#/admin-') && path !== '#/admin-direktori' && path !== '#/admin-buat-organisasi';
  }
  if (href === '#/admin-direktori') return path === '#/admin-direktori' || path === '#/admin-buat-organisasi';
  return path === href || (href === '#/katalog' && (path === '#/detail-barang' || path === '#/form-pengajuan')) ||
    (href === '#/barang-saya' && (path === '#/tambah-barang' || path === '#/edit-barang'));
}

function renderHeader(path) {
  const user = currentUser();
  const org = currentOrg();
  const badge = document.getElementById('header-org');
  if (badge) badge.textContent = org ? org.name : (user ? 'Belum ada organisasi' : 'Organisasi');

  const nav = document.getElementById('primary-nav');
  if (nav) {
    nav.innerHTML = navItems().map(([href, label]) => {
      const active = isActiveLink(href, path);
      return `<a class="nav-link ${href === '#/admin-monitoring' ? 'nav-link-admin' : ''} ${active ? 'nav-link-active' : ''}" href="${href}" ${active ? 'aria-current="page"' : ''}>${label}</a>`;
    }).join('');
  }

  const actions = document.getElementById('header-actions');
  if (actions) {
    if (!user) {
      actions.innerHTML = `
        <a class="btn-secondary btn-sm" href="#/login">Masuk</a>
        <a class="btn-primary btn-sm" href="#/daftar">Daftar</a>`;
    } else {
      const memberships = store.membershipsOfUser(user.id).filter((membership) => membership.status === 'Aktif');
      const picker = memberships.length > 1
        ? `<div class="org-switch">
            <label class="sr-only" for="org-picker">Organisasi aktif</label>
            <select class="select-inline" id="org-picker">${memberships.map((membership) => {
              const option = store.orgById(membership.orgId);
              if (!option) return '';
              return `<option value="${esc(option.id)}" ${org && org.id === option.id ? 'selected' : ''}>${esc(option.name)}</option>`;
            }).join('')}</select>
          </div>`
        : '';
      actions.innerHTML = `
        ${picker}
        <a class="user-chip" href="#/profil">
          <span class="avatar avatar-sm" aria-hidden="true">${esc(initials(user.name))}</span>
          <span class="user-chip-name">${esc(user.name.split(' ')[0])}</span>
        </a>
        <button class="btn-ghost btn-sm" type="button" data-action="logout">Keluar</button>`;
    }
  }

  const drawer = document.getElementById('mobile-menu-drawer');
  if (drawer) {
    const navLinks = navItems().map(([href, label]) => {
      const active = isActiveLink(href, path);
      return `<a class="drawer-link" href="${href}" ${active ? 'aria-current="page"' : ''}>${label}</a>`;
    }).join('');
    const accountLinks = user
      ? `<div class="drawer-section">
          <p class="drawer-title">Akun</p>
          <a class="drawer-link" href="#/profil">Profil</a>
          <a class="drawer-link" href="#/status-akun">Status akun</a>
          <a class="drawer-link" href="#/gabung">Gabung organisasi</a>
          <button class="drawer-link" type="button" data-action="logout">Keluar dari akun</button>
        </div>`
      : `<div class="drawer-section">
          <p class="drawer-title">Akun</p>
          <a class="drawer-link" href="#/login">Masuk</a>
          <a class="drawer-link" href="#/daftar">Daftar anggota</a>
          <a class="drawer-link" href="#/status-akun">Cek status pendaftaran</a>
        </div>`;
    drawer.innerHTML = `
      <div class="drawer-section">
        <p class="drawer-title">Navigasi</p>
        ${navLinks}
      </div>
      ${accountLinks}`;
  }
}

function renderBreadcrumb(route) {
  const nav = document.getElementById('global-breadcrumb');
  if (!nav) return;
  const parts = route.crumbs.map(([label, href], index) => {
    const last = index === route.crumbs.length - 1;
    if (last) return `<span class="current" aria-current="page">${esc(label)}</span>`;
    return `<a href="${href}">${esc(label)}</a><span class="sep" aria-hidden="true">/</span>`;
  });
  nav.innerHTML = parts.join('');
}

function renderDemoDock() {
  const select = document.getElementById('demo-user');
  if (!select) return;
  const options = store.db.users.map((user) => {
    const membership = primaryMembership(user.id);
    const org = membership ? store.orgById(membership.orgId) : null;
    const meta = membership ? `${membership.role} · ${org ? org.name : '—'}` : 'Tanpa organisasi';
    return `<option value="${esc(user.id)}" ${session.userId === user.id ? 'selected' : ''}>${esc(user.name)} — ${esc(meta)}</option>`;
  }).join('');
  select.innerHTML = options;
}

function render() {
  const { path, params } = parseHash();
  const route = ROUTES[path] || NOT_FOUND;
  const user = currentUser();

  if (route.access === 'auth' && !user) {
    toast('Masuk diperlukan', 'Halaman ini butuh akun. Pilih akun demo dari panel Data demo.', 'info');
    if (path !== '#/login') {
      navigate('#/login');
      return;
    }
  }

  if (route.access === 'member' && !user) {
    toast('Masuk diperlukan', 'Masuk sebagai anggota untuk membuka halaman ini.', 'info');
    navigate('#/login');
    return;
  }

  if (route.access === 'member' && !hasActiveMembership()) {
    toast('Akun belum aktif', 'Selesaikan verifikasi organisasi sebelum memakai katalog.', 'info');
    navigate('#/status-akun');
    return;
  }

  let pageHtml;
  if (route.access === 'admin' && !isOrgAdmin()) {
    pageHtml = restrictedBlock('Portal pengurus', 'Masuk sebagai Org Admin atau Pengurus organisasi untuk membuka halaman ini.');
  } else if (route.access === 'platform' && !isPlatformAdmin()) {
    pageHtml = restrictedBlock('Admin platform', 'Halaman ini hanya untuk akun dengan akses admin platform.');
  } else if (route.access === 'admin' && !currentOrg()) {
    pageHtml = emptyPage('Belum ada organisasi', 'Akun ini belum terhubung ke organisasi. Gabung lewat kode undangan terlebih dahulu.');
  } else {
    pageHtml = route.render(params);
  }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = pageHtml;

  document.title = route.title;
  renderHeader(path);
  renderBreadcrumb(route);
  renderDemoDock();
  closeMobileMenu();
}

/* ------------------------------------------------------------------ */
/* Mobile drawer                                                       */
/* ------------------------------------------------------------------ */

function closeMobileMenu() {
  const button = document.getElementById('mobile-menu-button');
  const drawer = document.getElementById('mobile-menu-drawer');
  if (button) button.setAttribute('aria-expanded', 'false');
  if (drawer) drawer.hidden = true;
}

function toggleMobileMenu() {
  const button = document.getElementById('mobile-menu-button');
  const drawer = document.getElementById('mobile-menu-drawer');
  if (!button || !drawer) return;
  const next = drawer.hidden;
  drawer.hidden = !next;
  button.setAttribute('aria-expanded', String(next));
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

function bindEvents() {
  document.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      event.preventDefault();
      handleAction(actionEl.dataset.action, actionEl.dataset, event);
      return;
    }

    const categoryButton = event.target.closest('[data-filter-cat]');
    if (categoryButton) {
      catalogState.category = categoryButton.dataset.filterCat;
      refreshCatalog();
      return;
    }

    const loanTabButton = event.target.closest('[data-loan-tab]');
    if (loanTabButton) {
      loanTab = loanTabButton.dataset.loanTab;
      refreshLoanList();
      return;
    }

    const memberStatusButton = event.target.closest('[data-member-status]');
    if (memberStatusButton) {
      memberStatusFilter = memberStatusButton.dataset.memberStatus;
      refreshAdminMembers();
      return;
    }

    if (event.target.closest('#mobile-menu-button')) {
      toggleMobileMenu();
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.id === 'catalog-search') {
      catalogState.query = target.value;
      refreshCatalog();
    } else if (target.id === 'admin-loan-search') {
      adminLoanQuery = target.value;
      refreshAdminLoans();
    } else if (target.id === 'member-search') {
      memberQuery = target.value;
      refreshAdminMembers();
    } else if (target.id === 'directory-search') {
      directoryQuery = target.value;
      refreshDirectory();
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (target.id === 'org-picker') {
      session.orgId = target.value;
      saveSession();
      const org = currentOrg();
      toast('Organisasi diganti', org ? `Sekarang membuka ${org.name}.` : 'Organisasi tidak ditemukan.', 'info');
      render();
    } else if (target.id === 'demo-user') {
      handleAction('login-as', { user: target.value }, event);
    } else if (target.id === 'loan-item') {
      const summary = document.getElementById('loan-summary');
      const item = store.itemById(target.value);
      if (summary && item) {
        summary.innerHTML = loanSummaryHtml(item);
        const startField = document.getElementById('loan-start');
        const endField = document.getElementById('loan-end');
        const start = startField ? startField.value : todayISO();
        if (startField) startField.min = todayISO();
        if (startField) startField.value = start < todayISO() ? todayISO() : start;
        if (endField) {
          endField.min = startField ? startField.value : todayISO();
          endField.value = addDaysISO(startField ? startField.value : todayISO(), Math.max(0, item.maxDays - 1));
        }
      }
    }
  });

  document.addEventListener('submit', handleFormSubmit);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (document.getElementById('modal-root') && document.getElementById('modal-root').innerHTML.trim()) {
        closeModal();
        return;
      }
      closeMobileMenu();
    }
    trapModalFocus(event);
  });

  window.addEventListener('hashchange', () => {
    render();
    const main = document.getElementById('main-content');
    if (main) main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
}

function init() {
  bindEvents();
  render();
}

window.addEventListener('DOMContentLoaded', init);
