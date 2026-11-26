import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { OrganizationService } from '../../core/services/organization.service';
import { Role, StructureMember } from '../../core/models';
import { AlertComponent } from '../../shared/alert/alert.component';
import { ToastService } from '../../shared/toast/toast.service';

interface MatrixRow {
  member: StructureMember;
  position: string;
  role: Role;
  originalPosition: string;
  originalRole: Role;
}

interface DivisionGroup {
  name: string;
  rows: MatrixRow[];
}

/** FE-FLP-04: Bagan & Penugasan Jabatan Pengurus (#/admin-bagan). */
@Component({
  selector: 'app-structure-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertComponent],
  styleUrls: ['../../shared/styles/support-page.css'],
  styles: [`
    .group-title { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin: 0 0 0.25rem; font-size: 1rem; font-weight: 700; }
    .row-fields { display: grid; grid-template-columns: 1fr; gap: 0 1rem; margin-top: 0.75rem; }
    @media (min-width: 560px) { .row-fields { grid-template-columns: 1fr 200px; } }
    .row-card { padding: 1rem 0; border-bottom: 1px solid var(--color-rule); }
    .row-card:last-child { border-bottom: 0; }
    .row-card.changed { background: var(--color-accent-soft); margin: 0 -0.75rem; padding-left: 0.75rem; padding-right: 0.75rem; border-radius: 8px; }
    .row-card .field { margin-bottom: 0; }
    .save-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-top: 1.25rem; }
    .hint { font-size: 0.82rem; color: var(--color-muted); margin: 0.75rem 0 0; }
  `],
  template: `
    <div class="page">
      <a routerLink="/struktur" class="back-link"><span aria-hidden="true">←</span> Lihat struktur</a>

      <header class="page-head">
        <div>
          <span class="kicker">Pengurus · organisasi</span>
          <h1 class="page-title">Bagan dan peran</h1>
          <p class="page-lede" *ngIf="orgName">
            Atur jabatan dan peran setiap anggota aktif di {{ orgName }}. Anggota hanya dapat melihat hasilnya.
          </p>
        </div>
      </header>

      <app-alert *ngIf="!activeOrgId" kind="info" title="Belum ada organisasi aktif"
        message="Pilih organisasi pada menu navigasi terlebih dahulu." />

      <app-alert *ngIf="activeOrgId && !isAdmin" kind="warning" title="Khusus pengurus"
        message="Halaman ini hanya untuk pengurus organisasi aktif." />

      <ng-container *ngIf="activeOrgId && isAdmin">
        <app-alert class="stack-gap" kind="info" title="Peran menentukan akses"
          message="Pengurus dapat membuka portal pengurus dan verifikasi. Anggota hanya dapat meminjam, menayangkan barang, dan melihat struktur." />

        <app-alert *ngIf="errorMessage" kind="error" title="Gagal memuat bagan" [message]="errorMessage" />
        <div *ngIf="errorMessage" class="retry-wrapper">
          <button type="button" class="btn btn-secondary" (click)="load()">Coba lagi</button>
        </div>

        <div *ngIf="loading" class="loading-state" role="status" aria-live="polite">
          <div class="spinner" aria-hidden="true"></div><span>Memuat bagan organisasi...</span>
        </div>

        <form *ngIf="!loading && !errorMessage" (ngSubmit)="save()" novalidate [attr.aria-busy]="saving">
          <app-alert *ngIf="formError" kind="error" title="Bagan belum dapat disimpan" [message]="formError" />

          <section class="panel" *ngFor="let group of groups" [attr.aria-label]="'Divisi ' + group.name">
            <h2 class="group-title">
              <span>{{ group.name }}</span>
              <span class="badge">{{ group.rows.length }} orang</span>
            </h2>
            <div class="row-card" *ngFor="let row of group.rows; trackBy: trackRow" [class.changed]="isChanged(row)">
              <div class="person">
                <span class="avatar" aria-hidden="true">{{ initials(row.member.fullName) }}</span>
                <div>
                  <span class="person-name">{{ row.member.fullName }}
                    <span class="badge badge-admin" *ngIf="isSelf(row)">Anda</span>
                  </span>
                  <span class="person-sub">{{ row.member.waNumber }}</span>
                </div>
              </div>
              <div class="row-fields">
                <div class="field">
                  <label [for]="'position-' + row.member.id">Jabatan</label>
                  <input [id]="'position-' + row.member.id" [name]="'position-' + row.member.id" type="text"
                    maxlength="50" [(ngModel)]="row.position"
                    [class.invalid]="submitted && positionError(row)" />
                  <p class="field-error" *ngIf="submitted && positionError(row)">{{ positionError(row) }}</p>
                </div>
                <div class="field">
                  <label [for]="'role-' + row.member.id">Peran</label>
                  <select [id]="'role-' + row.member.id" [name]="'role-' + row.member.id" [(ngModel)]="row.role">
                    <option value="ADMIN">Pengurus</option>
                    <option value="ANGGOTA">Anggota</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <div class="empty-state" *ngIf="!groups.length">
            <p class="empty-title">Belum ada anggota aktif</p>
            <p class="empty-body">Anggota yang sudah terverifikasi akan muncul di sini.</p>
          </div>

          <div class="save-bar" *ngIf="groups.length">
            <button type="submit" class="btn btn-primary" [disabled]="saving || !changedCount">
              {{ saving ? 'Menyimpan...' : 'Simpan bagan' }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="reset()" [disabled]="saving || !changedCount">Batalkan perubahan</button>
            <span class="field-hint" *ngIf="changedCount">{{ changedCount }} perubahan belum disimpan</span>
          </div>
          <p class="hint">Minimal satu anggota harus tetap menjadi pengurus, dan Anda tidak dapat menurunkan peran akun sendiri.</p>
        </form>
      </ng-container>
    </div>
  `
})
export class StructureMatrixComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly orgService = inject(OrganizationService);
  private readonly toast = inject(ToastService);

  rows: MatrixRow[] = [];
  groups: DivisionGroup[] = [];
  orgName = '';
  loading = true;
  saving = false;
  submitted = false;
  errorMessage: string | null = null;
  formError: string | null = null;

  private sub?: Subscription;

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  get activeOrgId(): string | null {
    return this.auth.activeMembership()?.orgId || localStorage.getItem('sarga_active_org_id');
  }

  get changedCount(): number {
    return this.rows.filter((r) => this.isChanged(r)).length;
  }

  ngOnInit(): void {
    this.sub = this.auth.currentUser$.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): void {
    const orgId = this.activeOrgId;
    if (!orgId || !this.isAdmin) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.errorMessage = null;
    this.orgService.getStructure(orgId).subscribe({
      next: (res) => {
        this.orgName = res.organization.name;
        this.rows = [...res.leaders, ...res.members].map((member) => ({
          member,
          position: member.position || '',
          role: member.role,
          originalPosition: member.position || '',
          originalRole: member.role
        }));
        this.buildGroups();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Tidak dapat memuat bagan organisasi saat ini.';
      }
    });
  }

  private buildGroups(): void {
    const map = new Map<string, MatrixRow[]>();
    for (const row of this.rows) {
      const key = row.member.division || (row.member.role === 'ADMIN' ? 'Pengurus Inti' : 'Anggota Umum');
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    // Pengurus Inti selalu di atas, sisanya urut abjad.
    this.groups = [...map.entries()]
      .map(([name, rows]) => ({ name, rows }))
      .sort((a, b) => (a.name === 'Pengurus Inti' ? -1 : b.name === 'Pengurus Inti' ? 1 : a.name.localeCompare(b.name, 'id')));
  }

  isChanged(row: MatrixRow): boolean {
    return row.position.trim() !== row.originalPosition || row.role !== row.originalRole;
  }

  isSelf(row: MatrixRow): boolean {
    return row.member.userId === this.auth.currentUser()?.id;
  }

  positionError(row: MatrixRow): string | null {
    const len = row.position.trim().length;
    return len < 1 || len > 50 ? 'Jabatan harus 1 sampai 50 karakter.' : null;
  }

  reset(): void {
    this.rows.forEach((r) => {
      r.position = r.originalPosition;
      r.role = r.originalRole;
    });
    this.submitted = false;
    this.formError = null;
  }

  save(): void {
    this.submitted = true;
    this.formError = null;

    if (this.rows.some((r) => this.positionError(r))) {
      this.formError = 'Periksa kembali kolom jabatan yang bertanda kesalahan.';
      return;
    }
    if (!this.rows.some((r) => r.role === 'ADMIN')) {
      this.formError = 'Minimal satu anggota harus menjadi pengurus.';
      return;
    }
    const self = this.rows.find((r) => this.isSelf(r));
    if (self && self.role === 'ANGGOTA' && self.originalRole === 'ADMIN') {
      this.formError = 'Anda tidak dapat menurunkan peran akun sendiri menjadi anggota.';
      return;
    }

    const changed = this.rows.filter((r) => this.isChanged(r));
    if (!changed.length || this.saving) return;

    this.saving = true;
    forkJoin(
      changed.map((r) => this.orgService.updateMembership(r.member.id, { role: r.role, position: r.position.trim() }))
    ).subscribe({
      next: () => {
        this.saving = false;
        this.submitted = false;
        this.toast.show('Bagan organisasi berhasil disimpan.', 'success');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        // Sebagian perubahan mungkin sudah tersimpan: muat ulang agar tampilan sesuai server.
        this.formError = err?.error?.message || 'Bagan gagal disimpan. Sebagian perubahan mungkin sudah tersimpan.';
        this.load();
      }
    });
  }

  initials(name?: string): string {
    return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  trackRow(_: number, row: MatrixRow): string {
    return row.member.id;
  }
}
