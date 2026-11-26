import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Membership } from '../../core/models';
import { AlertComponent } from '../../shared/alert/alert.component';
import { ToastService } from '../../shared/toast/toast.service';

/** FE-FLP-03: Profil Akun, Switcher Organisasi & Ganti Sandi (#/profil). */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertComponent],
  styleUrls: ['../../shared/styles/support-page.css'],
  styles: [`
    dialog.doc-dialog { width: min(34rem, calc(100vw - 2rem)); padding: 1.5rem; border: 1px solid var(--color-muted); border-radius: var(--radius-card); color: var(--color-ink); }
    dialog.doc-dialog::backdrop { background: rgba(17, 17, 17, 0.48); }
    .doc-dialog h2 { margin: 0 0 0.75rem; font-size: 1.2rem; }
    .doc-frame { background: var(--color-paper-2); border: 1px solid var(--color-rule); border-radius: 8px; padding: 0.5rem; max-height: 420px; overflow: auto; }
    .doc-frame img { display: block; max-width: 100%; height: auto; margin: 0 auto; }
    .doc-actions { display: flex; justify-content: flex-end; margin-top: 1rem; }
    .org-row-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
    .section-head h2 { font-size: 1.15rem; margin: 0 0 0.25rem; }
    .section-head p { margin: 0 0 0.75rem; font-size: 0.85rem; color: var(--color-muted); }
    .section-rule { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--color-rule); }
  `],
  template: `
    <div class="page">
      <a routerLink="/" class="back-link"><span aria-hidden="true">←</span> Kembali ke Beranda</a>

      <header class="page-head">
        <div>
          <span class="kicker">Akun</span>
          <h1 class="page-title">Profil dan keamanan akun</h1>
          <p class="page-lede">Data keanggotaan dan kata sandi Anda.</p>
        </div>
      </header>

      <app-alert *ngIf="!user()" kind="warning" title="Sesi belum dimuat"
        message="Data profil belum tersedia. Muat ulang halaman atau masuk kembali." />

      <ng-container *ngIf="user() as me">
        <div class="grid-2">
          <section class="panel" aria-labelledby="profile-title">
            <div class="person stack-gap">
              <span class="avatar" aria-hidden="true">{{ initials(me.fullName) }}</span>
              <div>
                <h2 id="profile-title" class="person-name">{{ me.fullName }}</h2>
                <span class="person-sub">{{ me.waNumber }}</span>
              </div>
            </div>
            <dl class="profile-list">
              <div class="profile-row"><dt>Alamat</dt><dd>{{ me.address || active()?.address || '—' }}</dd></div>
              <div class="profile-row"><dt>Organisasi aktif</dt><dd>{{ active()?.organization?.name || '—' }}</dd></div>
              <div class="profile-row"><dt>Peran</dt><dd>{{ roleLabel(active()) }}</dd></div>
              <div class="profile-row"><dt>Jabatan</dt><dd>{{ active()?.position || '—' }}</dd></div>
              <div class="profile-row"><dt>Status</dt>
                <dd><span class="badge" [ngClass]="statusClass(active()?.status)">{{ statusLabel(active()?.status) }}</span></dd>
              </div>
            </dl>
            <div class="head-actions" style="margin-top:1rem">
              <button type="button" class="btn btn-secondary btn-sm" (click)="openMyDocModal()" [disabled]="!active()">
                Lihat dokumen pendaftaran saya
              </button>
              <button type="button" class="btn btn-secondary btn-sm" (click)="logout()">Keluar dari akun</button>
            </div>
          </section>

          <section class="panel" aria-labelledby="pwd-title">
            <h2 id="pwd-title" class="panel-title">Ubah kata sandi</h2>
            <app-alert class="stack-gap" kind="info" title="Segera hadir"
              message="Penyimpanan kata sandi baru belum tersedia di server. Isian divalidasi di sini, tetapi belum dikirim." />
            <form (ngSubmit)="submitPassword()" novalidate>
              <div class="field">
                <label for="pwd-current">Kata sandi saat ini</label>
                <input id="pwd-current" name="current" type="password" autocomplete="current-password"
                  [(ngModel)]="pwd.current" [class.invalid]="submitted && errors.current" />
                <p class="field-error" *ngIf="submitted && errors.current">{{ errors.current }}</p>
              </div>
              <div class="field">
                <label for="pwd-new">Kata sandi baru</label>
                <input id="pwd-new" name="next" type="password" autocomplete="new-password"
                  [(ngModel)]="pwd.next" [class.invalid]="submitted && errors.next" />
                <p class="field-error" *ngIf="submitted && errors.next">{{ errors.next }}</p>
              </div>
              <div class="field">
                <label for="pwd-confirm">Ulangi kata sandi baru</label>
                <input id="pwd-confirm" name="confirm" type="password" autocomplete="new-password"
                  [(ngModel)]="pwd.confirm" [class.invalid]="submitted && errors.confirm" />
                <p class="field-error" *ngIf="submitted && errors.confirm">{{ errors.confirm }}</p>
              </div>
              <button type="submit" class="btn btn-primary">Simpan kata sandi</button>
            </form>
          </section>
        </div>

        <section class="section-rule" aria-labelledby="org-title">
          <div class="section-head">
            <h2 id="org-title">Keanggotaan organisasi</h2>
            <p>Satu akun dapat terhubung ke beberapa organisasi dengan peran berbeda.</p>
          </div>
          <div class="panel" *ngIf="me.memberships?.length; else noMemberships">
            <div class="list-item" *ngFor="let m of me.memberships">
              <div>
                <span class="person-name">{{ m.organization?.name || 'Organisasi ' + m.orgId }}</span>
                <span class="person-sub">{{ roleLabel(m) }} · {{ m.position || 'Anggota' }}</span>
                <span class="person-sub" *ngIf="m.status === 'DITOLAK' && m.rejectionReason">Alasan: {{ m.rejectionReason }}</span>
              </div>
              <div class="org-row-actions">
                <span class="badge" [ngClass]="statusClass(m.status)">{{ statusLabel(m.status) }}</span>
                <span class="badge badge-admin" *ngIf="m.orgId === active()?.orgId">Aktif</span>
                <button type="button" class="btn btn-secondary btn-sm"
                  *ngIf="m.status === 'TERVERIFIKASI' && m.orgId !== active()?.orgId"
                  (click)="switchOrg(m)" [attr.aria-label]="'Pindah ke ' + (m.organization?.name || 'organisasi ini')">
                  Pindah ke sini
                </button>
              </div>
            </div>
          </div>
          <ng-template #noMemberships>
            <div class="empty-state"><p class="empty-title">Belum ada keanggotaan</p>
              <p class="empty-body">Daftar dengan kode undangan dari pengurus organisasi.</p></div>
          </ng-template>
        </section>
      </ng-container>

      <dialog #docDialog class="doc-dialog" aria-label="Dokumen pendaftaran saya">
        <h2>Dokumen pendaftaran saya</h2>
        <ng-container *ngIf="active() as m">
          <p style="font-size:.85rem;margin:0 0 .75rem">Dokumen yang Anda lampirkan sebagai acuan verifikasi pengurus.</p>
          <div class="doc-frame" *ngIf="m.documentUrl; else noDoc">
            <img [src]="m.documentUrl" [alt]="'Dokumen pendaftaran ' + (user()?.fullName || '')" />
          </div>
          <ng-template #noDoc>
            <div class="empty-state"><p class="empty-title">Dokumen belum tersedia</p>
              <p class="empty-body">Unggah dokumen lewat API belum didukung, jadi belum ada berkas untuk ditampilkan.</p></div>
          </ng-template>
          <p style="font-size:.82rem;margin:.75rem 0 0" *ngIf="m.documentType || m.documentName">
            <strong>Jenis:</strong> {{ m.documentType || '—' }} · <strong>Berkas:</strong> {{ m.documentName || '—' }}
          </p>
        </ng-container>
        <div class="doc-actions"><button type="button" class="btn btn-secondary" (click)="closeDoc()">Tutup</button></div>
      </dialog>
    </div>
  `
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly user = this.auth.currentUser;
  readonly active = this.auth.activeMembership;

  pwd = { current: '', next: '', confirm: '' };
  submitted = false;

  @ViewChild('docDialog') private docDialog?: ElementRef<HTMLDialogElement>;

  /** Aturan mockup: sandi saat ini wajib, baru minimal 6 karakter, konfirmasi harus sama. */
  get errors(): { current: string | null; next: string | null; confirm: string | null } {
    return {
      current: this.pwd.current ? null : 'Kata sandi saat ini wajib diisi.',
      next: this.pwd.next.length >= 6 ? null : 'Kata sandi baru minimal 6 karakter.',
      confirm: this.pwd.confirm && this.pwd.next === this.pwd.confirm ? null : 'Ulangi kata sandi baru dengan tepat.'
    };
  }

  submitPassword(): void {
    this.submitted = true;
    const e = this.errors;
    if (e.current || e.next || e.confirm) return;
    // Endpoint ganti sandi belum ada di backend: jangan menampilkan keberhasilan palsu.
    this.toast.show('Kata sandi belum dapat diubah: fitur ini belum tersedia di server.', 'info');
  }

  initials(name?: string): string {
    return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  roleLabel(m: Membership | null | undefined): string {
    if (!m) return '—';
    return m.role === 'ADMIN' ? 'Pengurus' : 'Anggota';
  }

  statusLabel(status?: string): string {
    switch (status) {
      case 'TERVERIFIKASI': return 'Terverifikasi';
      case 'MENUNGGU_VERIFIKASI': return 'Menunggu verifikasi';
      case 'DITOLAK': return 'Ditolak';
      default: return '—';
    }
  }

  statusClass(status?: string): string {
    return status === 'TERVERIFIKASI' ? 'badge-ok' : status === 'DITOLAK' ? 'badge-danger' : 'badge-warn';
  }

  switchOrg(m: Membership): void {
    this.auth.setActiveOrg(m.orgId);
    this.toast.show(`Organisasi aktif: ${m.organization?.name || m.orgId}.`, 'success');
  }

  openMyDocModal(): void {
    const dialog = this.docDialog?.nativeElement;
    if (dialog && !dialog.open) dialog.showModal();
  }

  closeDoc(): void {
    this.docDialog?.nativeElement.close();
  }

  logout(): void {
    this.auth.logout();
    this.toast.show('Anda telah keluar dari akun.', 'info');
    this.router.navigate(['/auth/login']);
  }
}
