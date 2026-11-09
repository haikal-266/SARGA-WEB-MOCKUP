/**
 * SARGA (Share Antar Anggota) - UI Mockup Router & Interaction Controller
 * Designed for 30+ adults with text-driven clarity, liquid glass aesthetics, and Hallmark standards.
 */

// Registered mockup pages and their metadata
const PAGES = {
  '#/login': {
    title: 'Masuk Akun Anggota & Portal Demo',
    section: 'Autentikasi (FR-UM-01)',
    breadcrumb: ['Beranda', 'Masuk Akun']
  },
  '#/katalog': {
    title: 'Katalog Barang Komunitas',
    section: 'Peminjam (UC-PJ-01)',
    breadcrumb: ['Beranda', 'Katalog Barang Komunitas']
  },
  '#/detail-barang': {
    title: 'Rincian & Ketentuan Peminjaman Barang',
    section: 'Peminjam (FR-PJ-03)',
    breadcrumb: ['Katalog Barang', 'Bor Listrik Bosch Impact', 'Rincian Barang']
  },
  '#/form-pengajuan': {
    title: 'Formulir Pengajuan Pinjaman Barang',
    section: 'Peminjam (UC-PJ-02)',
    breadcrumb: ['Katalog Barang', 'Bor Listrik Bosch', 'Formulir Pengajuan']
  },
  '#/pinjaman-saya': {
    title: 'Pinjaman Saya (Pemantauan Status & Riwayat)',
    section: 'Peminjam (UC-PJ-04)',
    breadcrumb: ['Dashboard Anggota', 'Pinjaman Saya']
  },
  '#/barang-saya': {
    title: 'Barang Saya & Permintaan Masuk',
    section: 'Pemilik Barang (UC-PM-01 & UC-PM-03)',
    breadcrumb: ['Dashboard Anggota', 'Barang Saya & Permintaan']
  },
  '#/tambah-barang': {
    title: 'Daftarkan Barang Baru Milik Anda',
    section: 'Pemilik Barang (UC-PM-02)',
    breadcrumb: ['Barang Saya', 'Daftarkan Barang Baru']
  },
  '#/admin-monitoring': {
    title: 'Monitoring Sirkulasi Barang Lintas Organisasi',
    section: 'Portal Administrator (UC-AD-04)',
    breadcrumb: ['Admin', 'Monitoring Sirkulasi']
  },
  '#/admin-verifikasi': {
    title: 'Verifikasi Calon Anggota Baru',
    section: 'Portal Administrator (UC-AD-01)',
    breadcrumb: ['Admin', 'Verifikasi Anggota Baru']
  },
  '#/admin-organisasi': {
    title: 'Direktori Organisasi & Inventaris Komunal',
    section: 'Portal Administrator (UC-AD-02 & UC-AD-03)',
    breadcrumb: ['Admin', 'Direktori & Inventaris Komunal']
  },
  '#/profil': {
    title: 'Profil Pribadi & Keamanan Akun',
    section: 'Umum (FR-UM-04 & FR-UM-05)',
    breadcrumb: ['Pengaturan', 'Profil & Keamanan Akun']
  }
};

// Route controller
function navigateTo(hash) {
  if (!PAGES[hash]) {
    hash = '#/katalog';
  }
  window.location.hash = hash;
  renderRoute(hash);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderRoute(hash) {
  const targetHash = PAGES[hash] ? hash : '#/katalog';
  const pageMeta = PAGES[targetHash];

  // Hide all page containers
  document.querySelectorAll('.mockup-page').forEach(page => {
    page.classList.add('hidden');
  });

  // Show active page container
  const activePageId = 'page-' + targetHash.replace('#/', '');
  const activePageEl = document.getElementById(activePageId);
  if (activePageEl) {
    activePageEl.classList.remove('hidden');
  }

  // Update document title and page select dropdown
  document.title = `${pageMeta.title} - SARGA`;
  const selector = document.getElementById('quick-page-selector');
  if (selector) {
    selector.value = targetHash;
  }

  // Update Breadcrumbs
  const breadcrumbContainer = document.getElementById('global-breadcrumb');
  if (breadcrumbContainer) {
    breadcrumbContainer.innerHTML = pageMeta.breadcrumb.map((crumb, idx) => {
      const isLast = idx === pageMeta.breadcrumb.length - 1;
      return `
        <span class="${isLast ? 'font-semibold text-slate-900' : 'text-slate-500'}">${crumb}</span>
        ${!isLast ? '<span class="text-slate-300 mx-1.5" aria-hidden="true">/</span>' : ''}
      `;
    }).join('');
  }

  // Highlight active role indicator in navbar
  updateActiveRoleBadge(targetHash);

  // Highlight active tactile navigation tabs
  updateActiveNavTabs(targetHash);
}

function updateActiveNavTabs(hash) {
  const tabs = [
    { id: 'nav-tab-katalog', match: ['#/katalog', '#/detail-barang', '#/form-pengajuan'] },
    { id: 'nav-tab-pinjaman', match: ['#/pinjaman-saya'] },
    { id: 'nav-tab-barang', match: ['#/barang-saya'] },
    { id: 'nav-tab-tambah', match: ['#/tambah-barang'] },
    { id: 'nav-tab-profil', match: ['#/profil', '#/login'] },
    { id: 'nav-tab-admin', match: ['#/admin-monitoring', '#/admin-verifikasi', '#/admin-organisasi'] }
  ];

  tabs.forEach(tab => {
    const el = document.getElementById(tab.id);
    if (!el) return;
    const isActive = tab.match.includes(hash);
    if (isActive) {
      el.className = 'nav-tab nav-tab-active';
      el.setAttribute('aria-current', 'page');
    } else {
      el.className = 'nav-tab nav-tab-inactive';
      el.removeAttribute('aria-current');
    }
  });

  // Re-run Lucide icons if loaded
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function updateActiveRoleBadge(hash) {
  const roleBadge = document.getElementById('current-role-badge');
  if (!roleBadge) return;

  if (hash.startsWith('#/admin')) {
    roleBadge.textContent = 'Peran: Administrator Organisasi';
    roleBadge.className = 'status-badge-amber text-xs font-medium';
  } else if (hash === '#/barang-saya' || hash === '#/tambah-barang') {
    roleBadge.textContent = 'Peran: Pemilik Barang';
    roleBadge.className = 'status-badge-emerald text-xs font-medium';
  } else if (hash === '#/pinjaman-saya' || hash === '#/form-pengajuan' || hash === '#/detail-barang') {
    roleBadge.textContent = 'Peran: Peminjam Barang';
    roleBadge.className = 'status-badge-slate text-xs font-medium';
  } else {
    roleBadge.textContent = 'Peran: Anggota Komunitas';
    roleBadge.className = 'status-badge-emerald text-xs font-medium';
  }
}

// Interactive Toast Notification for UI Feedback
function showMockToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgBorder = type === 'success' 
    ? 'border-emerald-500 bg-emerald-50 text-emerald-950' 
    : (type === 'danger' ? 'border-rose-500 bg-rose-50 text-rose-950' : 'border-slate-400 bg-white text-slate-900');

  toast.className = `p-4 rounded-xl border-l-4 shadow-lg mb-3 glass-panel-elevated transform translate-y-2 opacity-0 transition-all duration-300 ${bgBorder} max-w-md`;
  toast.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="font-bold text-sm leading-tight">${title}</p>
        <p class="text-xs text-slate-600 mt-1 leading-relaxed">${message}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-slate-400 hover:text-slate-700 text-xs font-bold p-1" aria-label="Tutup pemberitahuan">✕</button>
    </div>
  `;

  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Filter items in catalog mockup
function filterCatalog(category) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    if (btn.dataset.category === category) {
      btn.className = 'filter-btn px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-700 text-white shadow-sm';
    } else {
      btn.className = 'filter-btn px-4 py-2 rounded-xl text-sm font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200';
    }
  });

  const cards = document.querySelectorAll('.catalog-item-card');
  cards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// Toggle Technical Developer Notes visibility
function toggleDevNotes() {
  const notes = document.querySelectorAll('.dev-note-banner');
  const toggleBtn = document.getElementById('btn-toggle-dev-notes');
  const isCurrentlyHidden = notes[0]?.classList.contains('hidden');

  notes.forEach(note => {
    if (isCurrentlyHidden) {
      note.classList.remove('hidden');
    } else {
      note.classList.add('hidden');
    }
  });

  if (toggleBtn) {
    toggleBtn.textContent = isCurrentlyHidden 
      ? '👁️ Sembunyikan Catatan Pengembang (SRS Notes)' 
      : '📋 Tampilkan Catatan Pengembang (SRS Notes)';
  }
}

// Admin actions
function handleApproveMember(btn) {
  showMockToast('Anggota Terverifikasi!', 'Akun Pak Agus Setiawan berhasil disetujui. Notifikasi konfirmasi akun telah dikirim ke WhatsApp pemohon (FR-AD-04).', 'success');
  const card = btn.closest('.verification-card') || btn.closest('.space-y-6');
  if (card) {
    card.innerHTML = `
      <div class="p-8 text-center text-emerald-900 font-bold">
        <span class="text-4xl block mb-2">✅</span>
        Semua permohonan anggota baru telah selesai diperiksa!
      </div>
    `;
  }
}

function handleRejectMember(btn) {
  showMockToast('Pendaftaran Ditolak', 'Permohonan ditolak. Alasan penolakan dikirimkan ke WhatsApp pemohon.', 'danger');
}

// Borrower / Lender actions
function handleCancelLoan(btn) {
  showMockToast('Pengajuan Dibatalkan', 'Pengajuan pinjam tangga lipat telah dibatalkan (FR-PJ-08).', 'danger');
  const panel = btn.closest('.glass-panel-elevated');
  if (panel) panel.remove();
}

function handleApproveLoan(btn) {
  showMockToast('Permintaan Disetujui!', 'Permintaan Pak Joko telah disetujui. Silakan lakukan koordinasi serah terima fisik via WhatsApp (FR-PM-08).', 'success');
  const panel = btn.closest('.glass-panel-elevated');
  if (panel) panel.remove();
}

function handleRejectLoan(btn) {
  showMockToast('Permintaan Ditolak', 'Permintaan peminjaman Pak Joko ditolak secara sopan (FR-PM-08).', 'danger');
  const panel = btn.closest('.glass-panel-elevated');
  if (panel) panel.remove();
}

function handleConfirmReturn(btn) {
  showMockToast('Konfirmasi Pengembalian Berhasil!', 'Barang telah tercatat kembali ke gudang Anda dalam status Tersedia (BR-09, FR-PM-10).', 'success');
  const panel = btn.closest('.glass-panel-elevated');
  if (panel) panel.remove();
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    renderRoute(window.location.hash);
  });

  // Initial routing
  const initialHash = window.location.hash || '#/katalog';
  renderRoute(initialHash);

  // Quick page selector dropdown handler
  const selector = document.getElementById('quick-page-selector');
  if (selector) {
    selector.addEventListener('change', (e) => {
      navigateTo(e.target.value);
    });
  }

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-button');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
  if (mobileMenuBtn && mobileMenuDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuDrawer.classList.toggle('hidden');
    });
  }
});

