import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { ToastService } from '../../shared/toast/toast.service';

/** FE-FLP-05: Direktori Seluruh Organisasi Admin Platform (#/admin-direktori). */
@Component({
  selector: 'app-platform-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertComponent],
  styleUrls: ['../../shared/styles/support-page.css'],
  styles: [`
    .toolbar { margin-bottom: 1.25rem; }
    .toolbar .field { margin-bottom: 0; max-width: 480px; }
    .org-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    @media (min-width: 640px) { .org-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 960px) { .org-grid { grid-template-columns: repeat(3, 1fr); } }
    .org-card { display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; background: var(--color-paper-2); border: 1px solid var(--color-rule); border-radius: 12px; padding: 1.15rem; }
    .org-card:hover { border-color: var(--color-accent-border); }
    .org-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem; }
    .org-name { font-size: 1.05rem; font-weight: 700; color: var(--color-ink); margin: 0 0 0.35rem; overflow-wrap: anywhere; }
    .org-meta { font-size: 0.82rem; color: var(--color-muted); margin: 0.15rem 0; overflow-wrap: anywhere; }
    .result-count { font-size: 0.82rem; color: var(--color-muted); margin: 0 0 0.75rem; }
  `],
  template: `
    <div class="page page-wide">
      <a routerLink="/" class="back-link"><span aria-hidden="true">←</span> Kembali ke Beranda</a>

      <header class="page-head">
        <div>
          <span class="kicker">Admin platform</span>
          <h1 class="page-title">Direktori organisasi</h1>
          <p class="page-lede">Daftar seluruh organisasi pada platform SARGA beserta akses pengelolaannya.</p>
        </div>
      </header>

      <app-alert *ngIf="!isPlatformAdmin" kind="warning" title="Khusus admin platform"
        message="Halaman ini hanya dapat dibuka oleh admin platform." />

      <ng-container *ngIf="isPlatformAdmin">
        <div class="toolbar">
          <div class="field">
            <label for="directory-search">Cari organisasi</label>
            <input id="directory-search" name="q" type="search" autocomplete="off"
              placeholder="Cari nama, jenis, atau alamat" [(ngModel)]="query" />
          </div>
        </div>

        <p class="result-count" role="status" aria-live="polite">{{ filtered.length }} dari {{ organizations.length }} organisasi</p>

        <div class="org-grid" *ngIf="filtered.length; else empty">
          <article class="org-card" *ngFor="let o of filtered; trackBy: trackOrg">
            <div>
              <div class="org-head">
                <span class="badge">{{ o.type || 'Organisasi' }}</span>
                <span class="badge" [ngClass]="o.status === 'Aktif' || o.status === 'AKTIF' ? 'badge-ok' : 'badge-warn'" *ngIf="o.status">
                  {{ o.status }}
                </span>
              </div>
              <h2 class="org-name">{{ o.name }}</h2>
              <p class="org-meta">{{ o.address || 'Alamat belum diisi' }}</p>
              <p class="org-meta" *ngIf="o.contact">Kontak: {{ o.contact }}</p>
              <p class="org-meta" *ngIf="o._count">Anggota: {{ o._count.memberships || 0 }} | Barang: {{ o._count.items || 0 }}</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" (click)="manage(o)"
              [attr.aria-label]="'Kelola ' + o.name">
              Kelola organisasi
            </button>
          </article>
        </div>
        <ng-template #empty>
          <div class="empty-state">
            <p class="empty-title">Organisasi tidak ditemukan</p>
            <p class="empty-body">Coba kata kunci lain atau hapus pencarian.</p>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `
})
export class PlatformDirectoryComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  query = '';
  platformOrgs: any[] = [];
  loading = false;

  get isPlatformAdmin(): boolean {
    return !!this.auth.currentUser()?.isPlatformAdmin;
  }

  ngOnInit(): void {
    if (this.isPlatformAdmin) {
      this.loadPlatformOrganizations();
    }
  }

  loadPlatformOrganizations(): void {
    this.loading = true;
    this.http.get<{ success: boolean; total: number; organizations: any[] }>(`${environment.apiUrl}/platform/organizations`)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.platformOrgs = res.organizations || [];
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  get organizations(): any[] {
    if (this.platformOrgs.length > 0) return this.platformOrgs;
    return (this.auth.currentUser()?.memberships ?? []).map(m => m.organization).filter(Boolean);
  }

  get filtered(): any[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.organizations;
    return this.organizations.filter((o) => {
      return [o.name, o.type, o.address, o.contact].some((v: string) => (v || '').toLowerCase().includes(q));
    });
  }

  manage(org: any): void {
    this.auth.setActiveOrg(org.id);
    this.toast.show(`Mengelola ${org.name}.`, 'info');
    this.router.navigate(['/admin-bagan']);
  }

  trackOrg(_: number, org: any): string {
    return org.id;
  }
}
