import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { OrganizationService } from '../../core/services/organization.service';
import { ToastService } from '../../shared/toast/toast.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { StructureResponse, StructureMember, Announcement } from '../../core/models';

@Component({
  selector: 'app-structure',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertComponent],
  template: `
    <div class="structure-page">
      <div class="page-top-nav">
        <a routerLink="/" class="back-link">
          <span aria-hidden="true">←</span> Kembali ke Beranda
        </a>
      </div>

      <header class="page-head split" *ngIf="structure">
        <div>
          <span class="kicker">ORGANISASI</span>
          <h1 class="page-title">Struktur {{ structure.organization.name }}</h1>
          <p class="page-lede">
            <span class="org-type">{{ structure.organization.type }}</span>
            <span class="bullet" aria-hidden="true">·</span>
            <span class="org-address">{{ structure.organization.address }}</span>
            <span class="bullet" aria-hidden="true" *ngIf="structure.organization.contact">·</span>
            <span class="org-contact" *ngIf="structure.organization.contact">Kontak: {{ structure.organization.contact }}</span>
          </p>
        </div>

        <div class="head-actions" *ngIf="isAdmin">
          <a routerLink="/admin-bagan" class="btn btn-sm btn-primary">Ubah bagan</a>
          <a routerLink="/admin-anggota" class="btn btn-sm btn-secondary">Kelola anggota</a>
        </div>
      </header>

      <!-- Alert & Status messages -->
      <app-alert
        *ngIf="errorMessage"
        kind="error"
        title="Gagal memuat struktur organisasi"
        [message]="errorMessage"
      />
      <div *ngIf="errorMessage" class="retry-wrapper">
        <button type="button" class="btn btn-secondary" (click)="loadStructure()">Coba lagi</button>
      </div>

      <!-- No active organization notice -->
      <app-alert
        *ngIf="!loading && !errorMessage && !activeOrgId"
        kind="info"
        title="Belum ada organisasi aktif"
        message="Silakan pilih organisasi Anda pada menu navigasi di atas untuk melihat struktur kepengurusan."
      />

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state" role="status" aria-live="polite">
        <div class="spinner" aria-hidden="true"></div>
        <span>Memuat data struktur organisasi...</span>
      </div>

      <!-- Main Structure Content -->
      <div *ngIf="!loading && !errorMessage && structure" class="structure-content">

        <!-- Executive Board / Leaders Section -->
        <section class="section-card" aria-labelledby="leaders-heading">
          <div class="section-header">
            <div>
              <h2 id="leaders-heading" class="section-title">Pengurus Inti</h2>
              <p class="section-subtitle">Jajaran penanggung jawab operasional dan pemegang mandat organisasi.</p>
            </div>
            <span class="count-badge" *ngIf="structure.leaders.length">
              {{ structure.leaders.length }} Pengurus
            </span>
          </div>

          <div class="leaders-grid" *ngIf="structure.leaders.length; else noLeaders">
            <article class="leader-card" *ngFor="let leader of structure.leaders">
              <div class="leader-card-header">
                <span class="leader-position">{{ leader.position || 'Pengurus' }}</span>
                <span class="badge badge-admin">Pengurus</span>
              </div>
              <div class="leader-card-body">
                <h3 class="leader-name">{{ leader.fullName }}</h3>
                <p class="leader-meta" *ngIf="leader.division">
                  <span class="muted-label">Divisi:</span> {{ leader.division }}
                </p>
                <p class="leader-meta">
                  <span class="muted-label">Bergabung:</span> {{ formatDate(leader.joinedAt) }}
                </p>
              </div>
              <div class="leader-card-actions">
                <a
                  class="wa-button"
                  [href]="formatWaUrl(leader.waNumber, leader.fullName)"
                  target="_blank"
                  rel="noopener noreferrer"
                  [attr.aria-label]="'Hubungi ' + leader.fullName + ' via WhatsApp'"
                >
                  <span class="wa-icon" aria-hidden="true">💬</span>
                  <span>Hubungi WhatsApp</span>
                  <span class="arrow" aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          </div>

          <ng-template #noLeaders>
            <div class="empty-state">
              <p class="empty-title">Belum ada pengurus terdaftar</p>
              <p class="empty-body">Pengurus organisasi dapat ditunjuk melalui menu pengelolaan bagan.</p>
            </div>
          </ng-template>
        </section>

        <!-- Active Members Section -->
        <section class="section-card" aria-labelledby="members-heading">
          <div class="section-header">
            <div>
              <h2 id="members-heading" class="section-title">Anggota Aktif</h2>
              <p class="section-subtitle">Daftar warga dan anggota terverifikasi yang tergabung dalam komunitas.</p>
            </div>
            <span class="count-badge" *ngIf="structure.members.length">
              {{ structure.members.length }} Anggota
            </span>
          </div>

          <div class="structure-list" *ngIf="structure.members.length; else noMembers">
            <div class="structure-row" *ngFor="let member of structure.members">
              <div class="structure-col-pos">
                <span class="structure-position">{{ member.position || 'Anggota' }}</span>
                <span class="badge badge-member" *ngIf="member.division">{{ member.division }}</span>
              </div>
              <div class="structure-col-person">
                <span class="structure-person">{{ member.fullName }}</span>
                <span class="member-date">Bergabung {{ formatDate(member.joinedAt) }}</span>
              </div>
              <div class="structure-col-action">
                <a
                  class="link-wa"
                  [href]="formatWaUrl(member.waNumber, member.fullName)"
                  target="_blank"
                  rel="noopener noreferrer"
                  [attr.aria-label]="'Hubungi ' + member.fullName + ' via WhatsApp'"
                >
                  <span aria-hidden="true">📱</span> WhatsApp ↗
                </a>
              </div>
            </div>
          </div>

          <ng-template #noMembers>
            <div class="empty-state">
              <p class="empty-title">Belum ada anggota aktif tambahan</p>
              <p class="empty-body">Anggota baru yang terverifikasi akan otomatis muncul pada daftar ini.</p>
            </div>
          </ng-template>
        </section>

        <!-- Invite Code Box (khusus Pengurus / Admin) -->
        <section class="invite-box" *ngIf="isAdmin && structure.organization.inviteCode" aria-labelledby="invite-heading">
          <div class="invite-info">
            <span id="invite-heading" class="invite-label">KODE UNDANGAN ORGANISASI</span>
            <div class="invite-code">{{ structure.organization.inviteCode }}</div>
            <span class="invite-meta" *ngIf="structure.organization.inviteExpires">
              Berlaku sampai {{ formatDate(structure.organization.inviteExpires) }}
            </span>
            <span class="invite-meta" *ngIf="!structure.organization.inviteExpires">
              Bagikan kode ini kepada warga untuk bergabung ke {{ structure.organization.name }}.
            </span>
          </div>
          <div class="invite-actions">
            <button
              type="button"
              class="btn btn-sm btn-primary"
              (click)="copyInviteCode(structure.organization.inviteCode)"
            >
              📋 Salin Kode
            </button>
            <a routerLink="/admin-organisasi" class="btn btn-sm btn-secondary">
              Atur Undangan
            </a>
          </div>
        </section>

        <!-- Latest Announcements Section -->
        <section class="section-rule" *ngIf="announcements.length > 0" aria-labelledby="announcements-heading">
          <div class="section-header">
            <div>
              <h2 id="announcements-heading" class="section-title">Pengumuman Terbaru</h2>
              <p class="section-subtitle">Informasi dan kabar terbaru dari pengurus organisasi.</p>
            </div>
          </div>

          <div class="announcements-list">
            <article class="announcement-item" *ngFor="let item of announcements">
              <div class="announcement-head">
                <h3 class="announcement-title">{{ item.title }}</h3>
                <span class="announcement-date">
                  {{ formatDate(item.createdAt) }}
                  <ng-container *ngIf="item.author?.fullName">· {{ item.author?.fullName }}</ng-container>
                </span>
              </div>
              <p class="announcement-body">{{ item.content }}</p>
            </article>
          </div>

          <div class="all-announcements-action">
            <a routerLink="/pengumuman" class="btn btn-secondary">
              Lihat semua pengumuman
            </a>
          </div>
        </section>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .structure-page {
      max-width: 880px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3.5rem;
    }

    .page-top-nav {
      margin-bottom: 1.25rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: var(--color-muted);
      text-decoration: none;
      min-height: 44px;
      padding: 0.25rem 0;
      transition: color 0.15s ease;
    }

    .back-link:hover {
      color: var(--color-ink);
      text-decoration: underline;
    }

    /* Page Head */
    .page-head {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-bottom: 1.5rem;
      margin-bottom: 1.75rem;
      border-bottom: 1px solid var(--color-rule);
    }

    @media (min-width: 640px) {
      .page-head.split {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
      }
    }

    .kicker {
      display: inline-block;
      margin-bottom: 0.35rem;
      color: var(--color-accent);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-ink);
      line-height: 1.2;
      margin: 0 0 0.4rem;
    }

    @media (min-width: 640px) {
      .page-title {
        font-size: 2rem;
      }
    }

    .page-lede {
      margin: 0;
      color: var(--color-muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .bullet {
      margin: 0 0.35rem;
      color: var(--color-rule-dark);
    }

    .head-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 3rem 1rem;
      color: var(--color-muted);
      font-size: 0.95rem;
    }

    .spinner {
      width: 22px;
      height: 22px;
      border: 3px solid var(--color-rule);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .retry-wrapper {
      margin-top: 1rem;
    }

    /* Sections */
    .structure-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .section-card {
      background: var(--color-paper);
      border: 1px solid var(--color-rule);
      border-radius: var(--radius-card);
      padding: 1.5rem;
      box-shadow: var(--shadow-subtle);
    }

    .section-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--color-rule-2);
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-ink);
      margin: 0 0 0.25rem;
    }

    .section-subtitle {
      font-size: 0.85rem;
      color: var(--color-muted);
      margin: 0;
    }

    .count-badge {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      background: var(--color-accent-soft);
      color: var(--color-accent-soft-ink);
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
    }

    /* Leaders Grid */
    .leaders-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 600px) {
      .leaders-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      }
    }

    .leader-card {
      background: var(--color-paper-2);
      border: 1px solid var(--color-rule);
      border-radius: 12px;
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }

    .leader-card:hover {
      border-color: var(--color-accent-border);
      transform: translateY(-2px);
    }

    .leader-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.6rem;
    }

    .leader-position {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--color-accent);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-pill);
    }

    .badge-admin {
      background: var(--color-accent-soft);
      color: var(--color-accent-soft-ink);
      border: 1px solid var(--color-accent-border);
    }

    .badge-member {
      background: var(--color-paper-3);
      color: var(--color-muted);
    }

    .leader-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-ink);
      margin: 0 0 0.35rem;
    }

    .leader-meta {
      font-size: 0.8rem;
      color: var(--color-muted);
      margin: 0.15rem 0;
    }

    .muted-label {
      color: var(--color-muted-light);
    }

    .leader-card-actions {
      margin-top: 1rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--color-rule);
    }

    .wa-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      width: 100%;
      min-height: 44px;
      padding: 0.5rem 0.85rem;
      background: var(--color-success-soft);
      color: var(--color-success-ink);
      border: 1px solid var(--color-success-border);
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .wa-button:hover {
      background: #d1fae5;
      border-color: #6ee7b7;
    }

    .wa-icon {
      font-size: 1rem;
    }

    .arrow {
      font-size: 0.85rem;
      margin-left: auto;
    }

    /* Structure List for Members */
    .structure-list {
      display: flex;
      flex-direction: column;
      border-top: 2px solid var(--color-rule-dark);
    }

    .structure-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.4rem;
      padding: 0.85rem 0;
      border-bottom: 1px solid var(--color-rule);
      align-items: center;
    }

    @media (min-width: 640px) {
      .structure-row {
        grid-template-columns: 200px minmax(0, 1fr) auto;
        gap: 1rem;
      }
    }

    .structure-col-pos {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .structure-position {
      color: var(--color-muted);
      font-size: 0.82rem;
      font-weight: 600;
    }

    .structure-col-person {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .structure-person {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-ink);
    }

    .member-date {
      font-size: 0.75rem;
      color: var(--color-muted-light);
    }

    .structure-col-action {
      display: flex;
      justify-content: flex-start;
    }

    @media (min-width: 640px) {
      .structure-col-action {
        justify-content: flex-end;
      }
    }

    .link-wa {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--color-success-ink);
      background: var(--color-success-soft);
      border: 1px solid var(--color-success-border);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-pill);
      text-decoration: none;
      min-height: 44px;
      transition: background 0.15s ease;
    }

    .link-wa:hover {
      background: #d1fae5;
      text-decoration: none;
    }

    /* Invite Box (Admin only) */
    .invite-box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.15rem 1.25rem;
      border: 1px solid var(--color-accent-border);
      border-radius: 12px;
      background: var(--color-accent-soft);
    }

    .invite-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .invite-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--color-accent-soft-ink);
    }

    .invite-code {
      font-family: var(--font-mono);
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--color-accent-soft-ink);
    }

    .invite-meta {
      font-size: 0.78rem;
      color: var(--color-muted);
    }

    .invite-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    /* Announcements Section */
    .section-rule {
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-rule);
    }

    .announcements-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .announcement-item {
      padding: 1rem 0;
      border-bottom: 1px solid var(--color-rule);
    }

    .announcement-item:first-child {
      padding-top: 0;
    }

    .announcement-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.35rem;
      margin-bottom: 0.35rem;
    }

    .announcement-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-ink);
      margin: 0;
    }

    .announcement-date {
      color: var(--color-muted);
      font-size: 0.78rem;
    }

    .announcement-body {
      margin: 0;
      color: var(--color-muted);
      font-size: 0.88rem;
      line-height: 1.5;
    }

    .all-announcements-action {
      margin-top: 1rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      border-radius: var(--radius-input);
      min-height: 44px;
      padding: 0.5rem 1rem;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid transparent;
      transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
    }

    .btn:active {
      transform: scale(0.98);
    }

    .btn-sm {
      min-height: 38px;
      padding: 0.35rem 0.75rem;
      font-size: 0.82rem;
    }

    .btn-primary {
      background: var(--color-accent);
      color: var(--color-accent-ink);
      border-color: var(--color-accent);
    }

    .btn-primary:hover {
      background: #0d625b;
      border-color: #0d625b;
    }

    .btn-secondary {
      background: var(--color-paper);
      color: var(--color-ink);
      border-color: var(--color-rule);
    }

    .btn-secondary:hover {
      background: var(--color-paper-2);
      border-color: var(--color-ink-hover);
    }

    /* Focus visible */
    a:focus-visible,
    button:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }

    /* Empty state */
    .empty-state {
      padding: 2rem 1rem;
      text-align: center;
      background: var(--color-paper-2);
      border-radius: 8px;
      border: 1px dashed var(--color-rule);
    }

    .empty-title {
      font-weight: 700;
      color: var(--color-ink);
      margin: 0 0 0.25rem;
      font-size: 0.95rem;
    }

    .empty-body {
      color: var(--color-muted);
      font-size: 0.85rem;
      margin: 0;
    }
  `]
})
export class StructureComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly orgService = inject(OrganizationService);
  private readonly toastService = inject(ToastService);

  loading = true;
  errorMessage: string | null = null;
  structure: StructureResponse | null = null;
  announcements: Announcement[] = [];

  private sub?: Subscription;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get activeOrgId(): string | null {
    const mem = this.authService.activeMembership();
    if (mem?.orgId) return mem.orgId;
    return localStorage.getItem('sarga_active_org_id');
  }

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe(() => {
      this.loadStructure();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadStructure(): void {
    const orgId = this.activeOrgId;
    if (!orgId) {
      this.loading = false;
      this.structure = null;
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.orgService.getStructure(orgId).subscribe({
      next: (res) => {
        this.structure = res;
        this.loading = false;
        this.loadAnnouncements();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Tidak dapat memuat struktur organisasi saat ini.';
      }
    });
  }

  loadAnnouncements(): void {
    this.orgService.getAnnouncements().subscribe({
      next: (res) => {
        if (res?.announcements) {
          // Ambil maksimal 2 pengumuman terbaru sesuai mockup
          this.announcements = res.announcements.slice(0, 2);
        }
      },
      error: () => {
        // Pengumuman bersifat pelengkap pada halaman struktur, abaikan jika error
        this.announcements = [];
      }
    });
  }

  formatWaUrl(waNumber: string, name?: string): string {
    let digits = (waNumber || '').replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = '62' + digits.slice(1);
    }
    const orgName = this.structure?.organization?.name || 'SARGA';
    const text = encodeURIComponent(`Halo ${name || ''}, saya menghubungi via SARGA terkait komunitas ${orgName}.`);
    return `https://wa.me/${digits}?text=${text}`;
  }

  copyInviteCode(code?: string): void {
    if (!code) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.toastService.show(`Kode undangan ${code} berhasil disalin ke clipboard!`, 'success');
      }).catch(() => {
        this.toastService.show(`Kode undangan: ${code}`, 'info');
      });
    } else {
      this.toastService.show(`Kode undangan: ${code}`, 'info');
    }
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
}
