import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrganizationService } from '../../core/services/organization.service';
import { Announcement } from '../../core/models';
import { AlertComponent } from '../../shared/alert/alert.component';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { ToastService } from '../../shared/toast/toast.service';

/** FE-FLP-02: Papan Pengumuman Organisasi (#/pengumuman). */
@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertComponent, ConfirmationDialogComponent],
  styleUrls: ['../../shared/styles/support-page.css'],
  styles: [`
    .announcement { padding: 1rem 0; border-bottom: 1px solid var(--color-rule); }
    .announcement:first-child { padding-top: 0; }
    .announcement:last-child { border-bottom: 0; padding-bottom: 0; }
    .announcement-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.35rem; margin-bottom: 0.4rem; }
    .announcement-title { font-size: 1rem; font-weight: 700; color: var(--color-ink); margin: 0; }
    .announcement-meta { font-size: 0.78rem; color: var(--color-muted); }
    .announcement-body { margin: 0; color: var(--color-ink-2); font-size: 0.9rem; line-height: 1.55; white-space: pre-line; overflow-wrap: anywhere; }
    .announcement-actions { margin-top: 0.6rem; }
    .counter { text-align: right; }
  `],
  template: `
    <div class="page">
      <a routerLink="/struktur" class="back-link"><span aria-hidden="true">←</span> Struktur organisasi</a>

      <header class="page-head">
        <div>
          <span class="kicker">Organisasi</span>
          <h1 class="page-title">Pengumuman</h1>
          <p class="page-lede" *ngIf="orgName">Informasi dari pengurus untuk anggota {{ orgName }}.</p>
        </div>
      </header>

      <app-alert *ngIf="!activeOrgId" kind="info" title="Belum ada organisasi aktif"
        message="Pilih organisasi pada menu navigasi untuk melihat pengumuman." />

      <ng-container *ngIf="activeOrgId">
        <!-- Form tambah pengumuman (khusus pengurus) -->
        <section class="panel stack-gap" *ngIf="isAdmin" aria-labelledby="new-announcement-title">
          <h2 id="new-announcement-title" class="panel-title">Buat pengumuman</h2>
          <app-alert *ngIf="formError" kind="error" title="Pengumuman gagal dikirim" [message]="formError" />
          <form (ngSubmit)="submit()" novalidate [attr.aria-busy]="saving">
            <div class="field">
              <label for="announcement-title">Judul</label>
              <input id="announcement-title" name="title" type="text" maxlength="120"
                [(ngModel)]="form.title" [class.invalid]="submitted && titleError"
                [attr.aria-invalid]="submitted && !!titleError" />
              <p class="field-error" *ngIf="submitted && titleError">{{ titleError }}</p>
            </div>
            <div class="field">
              <label for="announcement-content">Isi pengumuman</label>
              <textarea id="announcement-content" name="content" rows="4" maxlength="2000"
                [(ngModel)]="form.content" [class.invalid]="submitted && contentError"
                [attr.aria-invalid]="submitted && !!contentError"></textarea>
              <p class="field-error" *ngIf="submitted && contentError">{{ contentError }}</p>
              <p class="field-hint counter">{{ form.content.length }}/2000</p>
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              {{ saving ? 'Mengirim...' : 'Kirim pengumuman' }}
            </button>
          </form>
        </section>

        <app-alert *ngIf="errorMessage" kind="error" title="Gagal memuat pengumuman" [message]="errorMessage" />
        <div *ngIf="errorMessage" class="retry-wrapper">
          <button type="button" class="btn btn-secondary" (click)="load()">Coba lagi</button>
        </div>

        <div *ngIf="loading" class="loading-state" role="status" aria-live="polite">
          <div class="spinner" aria-hidden="true"></div><span>Memuat pengumuman...</span>
        </div>

        <section class="panel" *ngIf="!loading && !errorMessage" aria-label="Daftar pengumuman">
          <div *ngIf="announcements.length; else empty">
            <article class="announcement" *ngFor="let item of announcements; trackBy: trackById">
              <div class="announcement-head">
                <h3 class="announcement-title">{{ item.title }}</h3>
                <span class="announcement-meta">
                  {{ formatDate(item.createdAt) }}<ng-container *ngIf="item.author?.fullName"> · {{ item.author?.fullName }}</ng-container>
                </span>
              </div>
              <p class="announcement-body">{{ item.content }}</p>
              <div class="announcement-actions" *ngIf="isAdmin">
                <button type="button" class="btn btn-danger btn-sm" [disabled]="deletingId === item.id"
                  (click)="askDelete(item)" [attr.aria-label]="'Hapus pengumuman ' + item.title">
                  {{ deletingId === item.id ? 'Menghapus...' : 'Hapus' }}
                </button>
              </div>
            </article>
          </div>
          <ng-template #empty>
            <div class="empty-state">
              <p class="empty-title">Belum ada pengumuman</p>
              <p class="empty-body">Pengurus dapat mengirim jadwal pengecekan alat atau kebijakan hari libur.</p>
            </div>
          </ng-template>
        </section>
      </ng-container>

      <app-confirmation-dialog
        [open]="!!pendingDelete"
        title="Hapus pengumuman?"
        [message]="pendingDelete ? 'Pengumuman &quot;' + pendingDelete.title + '&quot; tidak akan terlihat lagi oleh anggota.' : ''"
        confirmLabel="Hapus"
        [destructive]="true"
        (confirmed)="confirmDelete()"
        (cancelled)="pendingDelete = null"
      />
    </div>
  `
})
export class AnnouncementsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly orgService = inject(OrganizationService);
  private readonly toast = inject(ToastService);

  announcements: Announcement[] = [];
  loading = true;
  saving = false;
  submitted = false;
  errorMessage: string | null = null;
  formError: string | null = null;
  deletingId: string | null = null;
  pendingDelete: Announcement | null = null;
  form = { title: '', content: '' };

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  get activeOrgId(): string | null {
    return this.auth.activeMembership()?.orgId || localStorage.getItem('sarga_active_org_id');
  }

  get orgName(): string {
    return this.auth.activeMembership()?.organization?.name ?? '';
  }

  get titleError(): string | null {
    const len = this.form.title.trim().length;
    return len < 3 || len > 120 ? 'Judul harus 3 sampai 120 karakter.' : null;
  }

  get contentError(): string | null {
    const len = this.form.content.trim().length;
    return len < 5 || len > 2000 ? 'Isi pengumuman harus 5 sampai 2000 karakter.' : null;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.activeOrgId) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.errorMessage = null;
    this.orgService.getAnnouncements().subscribe({
      next: (res) => {
        // Server sudah mengurutkan terbaru lebih dulu.
        this.announcements = res.announcements ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Tidak dapat memuat pengumuman saat ini.';
      }
    });
  }

  submit(): void {
    this.submitted = true;
    this.formError = null;
    if (this.titleError || this.contentError || this.saving) return;

    this.saving = true;
    this.orgService.createAnnouncement({
      title: this.form.title.trim(),
      content: this.form.content.trim()
    }).subscribe({
      next: (res) => {
        this.saving = false;
        this.submitted = false;
        this.form = { title: '', content: '' };
        this.toast.show(res.message || 'Pengumuman terkirim.', 'success');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'Pengumuman tidak dapat dikirim saat ini.';
      }
    });
  }

  askDelete(item: Announcement): void {
    this.pendingDelete = item;
  }

  confirmDelete(): void {
    const target = this.pendingDelete;
    this.pendingDelete = null;
    if (!target) return;

    this.deletingId = target.id;
    this.orgService.deleteAnnouncement(target.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.announcements = this.announcements.filter((a) => a.id !== target.id);
        this.toast.show('Pengumuman dihapus.', 'info');
      },
      error: (err) => {
        this.deletingId = null;
        this.toast.show(err?.error?.message || 'Pengumuman gagal dihapus.', 'error');
      }
    });
  }

  trackById(_: number, item: Announcement): string {
    return item.id;
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
  }
}
