import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LoanService } from '../../core/services/loan.service';
import { LoanStatus, LoanTransaction } from '../../core/models';
import { AlertComponent } from '../../shared/alert/alert.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { LoanModalComponent } from '../../shared/loan-modal/loan-modal.component';
import { ToastService } from '../../shared/toast/toast.service';

type LoanFilterTab = 'SEMUA' | 'MENUNGGU' | 'AKTIF' | 'SELESAI' | 'DITOLAK' | 'DIBATALKAN';

const LOAN_TABS: Array<{ key: LoanFilterTab; label: string }> = [
  { key: 'SEMUA', label: 'Semua' },
  { key: 'MENUNGGU', label: 'Menunggu' },
  { key: 'AKTIF', label: 'Aktif' },
  { key: 'SELESAI', label: 'Selesai' },
  { key: 'DITOLAK', label: 'Ditolak' },
  { key: 'DIBATALKAN', label: 'Dibatalkan' }
];

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertComponent, StatusBadgeComponent, LoanModalComponent],
  template: `
    <div class="page page-mid">
      <header class="page-head split">
        <div>
          <p class="kicker">Peminjam</p>
          <h1>Pinjaman saya</h1>
          <p class="lede">
            Pantau pengajuan yang menunggu, pinjaman berjalan, dan riwayat yang sudah selesai.
          </p>
        </div>
        <div class="head-actions" *ngIf="currentUser()">
          <a class="btn-primary" routerLink="/katalog">Cari alat</a>
        </div>
      </header>

      <!-- Belum Masuk -->
      <div *ngIf="!currentUser(); else loggedInView" class="empty">
        <p class="empty-title">Masuk untuk melihat pinjaman</p>
        <p class="empty-body">Masuk sebagai anggota untuk memantau pengajuan dan riwayat peminjaman Anda.</p>
        <a class="btn-primary empty-cta" routerLink="/auth/login">Masuk ke akun</a>
      </div>

      <ng-template #loggedInView>
        <!-- Stat Strip -->
        <div class="stat-strip">
          <div class="stat">
            <span class="stat-value">{{ counts().menunggu }}</span>
            <span class="stat-label">Menunggu persetujuan</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ counts().aktif }}</span>
            <span class="stat-label">Sedang dipinjam</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ counts().selesai }}</span>
            <span class="stat-label">Selesai</span>
          </div>
        </div>

        <!-- Tab Filter Status -->
        <div class="tabs" role="tablist" aria-label="Filter status pinjaman">
          <button
            *ngFor="let tab of tabs"
            class="tab"
            type="button"
            role="tab"
            [attr.aria-selected]="activeTab() === tab.key"
            (click)="setTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <p *ngIf="loading" class="loading-text" role="status" aria-live="polite">
          Memuat daftar pinjaman...
        </p>

        <app-alert
          *ngIf="errorMessage"
          kind="error"
          title="Pinjaman belum dapat dimuat"
          [message]="errorMessage"
        />

        <!-- Daftar Kartu Pinjaman -->
        <div *ngIf="!loading && !errorMessage && filteredLoans().length > 0" class="list">
          <article *ngFor="let loan of filteredLoans()" class="list-item">
            <div class="item-head">
              <div>
                <span class="cell-main">
                  <a [routerLink]="['/katalog', loan.itemId]">{{ loan.item?.name || 'Barang' }}</a>
                </span>
                <span class="cell-sub">
                  {{ loan.item?.code || '—' }} · {{ loan.owner?.fullName || 'Aset organisasi' }}
                </span>
              </div>
              <app-status-badge
                kind="loan"
                [status]="loan.status"
                perspective="peminjam"
                [overdue]="isOverdue(loan)"
              />
            </div>

            <dl class="definition-list">
              <div>
                <dt>Tanggal pinjam</dt>
                <dd>
                  {{ formatDate(loan.startDate) }} – {{ formatDate(loan.endDate) }}
                  <span *ngIf="isOverdue(loan)" class="overdue-inline">
                    (Terlambat {{ daysOverdue(loan) }} hari)
                  </span>
                </dd>
              </div>
              <div>
                <dt>Keperluan</dt>
                <dd>{{ loan.purpose }}</dd>
              </div>
              <div *ngIf="loan.status === 'DITOLAK' && loan.rejectionReason">
                <dt>Alasan ditolak</dt>
                <dd class="rejected-reason">{{ loan.rejectionReason }}</dd>
              </div>
            </dl>

            <div class="actions loan-actions">
              <button
                class="btn-secondary btn-sm"
                type="button"
                (click)="openDetailModal(loan)"
              >
                Rincian transaksi
              </button>
              <button
                *ngIf="loan.status === 'MENUNGGU'"
                class="btn-danger btn-sm"
                type="button"
                [disabled]="busyLoanId === loan.id"
                (click)="cancelLoan(loan)"
              >
                {{ busyLoanId === loan.id ? 'Membatalkan...' : 'Batalkan' }}
              </button>
            </div>
          </article>
        </div>

        <!-- Kosong -->
        <div *ngIf="!loading && !errorMessage && filteredLoans().length === 0" class="empty">
          <p class="empty-title">Belum ada pinjaman di filter ini</p>
          <p class="empty-body">Pengajuan yang Anda kirim akan muncul di sini beserta statusnya.</p>
          <a class="btn-primary empty-cta" routerLink="/katalog">Cari alat</a>
        </div>
      </ng-template>

      <!-- Modal Rincian Transaksi (FE-WLD-14) -->
      <app-loan-modal
        [open]="!!selectedLoan"
        [loan]="selectedLoan"
        [isAdmin]="authService.isAdmin()"
        [currentUserId]="currentUser()?.id || ''"
        [busy]="modalBusy"
        (closed)="closeDetailModal()"
        (cancel)="cancelLoanFromModal($event)"
      />
    </div>
  `,
  styles: [`
    .loading-text {
      color: var(--color-muted);
      font-size: 0.95rem;
    }
    .empty-cta {
      margin-top: 1rem;
    }
    .loan-actions {
      margin-top: 0.25rem;
    }
    .overdue-inline {
      color: var(--color-rose-ink);
      font-weight: 600;
      margin-left: 0.35rem;
    }
    .rejected-reason {
      color: var(--color-rose-ink);
    }
  `]
})
export class MyLoansComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly loanService = inject(LoanService);
  private readonly toastService = inject(ToastService);
  private subscription = new Subscription();

  readonly tabs = LOAN_TABS;
  currentUser = this.authService.currentUser;

  loans = signal<LoanTransaction[]>([]);
  activeTab = signal<LoanFilterTab>('SEMUA');
  loading = false;
  errorMessage = '';
  busyLoanId = '';

  selectedLoan: LoanTransaction | null = null;
  modalBusy = false;

  counts = computed(() => {
    const all = this.loans();
    return {
      menunggu: all.filter(l => l.status === 'MENUNGGU').length,
      aktif: all.filter(l => l.status === 'AKTIF').length,
      selesai: all.filter(l => l.status === 'SELESAI').length
    };
  });

  filteredLoans = computed(() => {
    const tab = this.activeTab();
    const all = this.loans();
    if (tab === 'SEMUA') return all;
    return all.filter(loan => loan.status === (tab as LoanStatus));
  });

  ngOnInit(): void {
    if (this.currentUser()) {
      this.loadLoans();
    } else {
      this.subscription.add(
        this.authService.currentUser$.subscribe(user => {
          if (user && this.loans().length === 0 && !this.loading) {
            this.loadLoans();
          }
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadLoans(): void {
    this.loading = true;
    this.errorMessage = '';
    this.subscription.add(
      this.loanService.getMyLoans().subscribe({
        next: res => {
          this.loans.set(res.loans || []);
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage =
            err.error?.message || 'Gagal memuat riwayat pinjaman Anda.';
        }
      })
    );
  }

  setTab(tab: LoanFilterTab): void {
    this.activeTab.set(tab);
  }

  cancelLoan(loan: LoanTransaction): void {
    if (this.busyLoanId || loan.status !== 'MENUNGGU') return;
    this.busyLoanId = loan.id;
    this.subscription.add(
      this.loanService.cancelLoan(loan.id).subscribe({
        next: res => {
          this.busyLoanId = '';
          const updated = res.loan;
          this.loans.update(list =>
            list.map(entry => (entry.id === loan.id ? { ...entry, ...updated, status: 'DIBATALKAN' } : entry))
          );
          this.toastService.show(
            'Pengajuan dibatalkan: Pengajuan tidak diteruskan ke pemilik barang.',
            'info'
          );
        },
        error: (err: HttpErrorResponse) => {
          this.busyLoanId = '';
          this.toastService.show(
            err.error?.message || 'Gagal membatalkan pengajuan pinjaman.',
            'error'
          );
          this.loadLoans();
        }
      })
    );
  }

  cancelLoanFromModal(loan: LoanTransaction): void {
    if (this.modalBusy) return;
    this.modalBusy = true;
    this.subscription.add(
      this.loanService.cancelLoan(loan.id).subscribe({
        next: res => {
          this.modalBusy = false;
          const updated = res.loan;
          this.loans.update(list =>
            list.map(entry => (entry.id === loan.id ? { ...entry, ...updated, status: 'DIBATALKAN' } : entry))
          );
          this.selectedLoan = null;
          this.toastService.show(
            'Pengajuan dibatalkan: Pengajuan tidak diteruskan ke pemilik barang.',
            'info'
          );
        },
        error: (err: HttpErrorResponse) => {
          this.modalBusy = false;
          this.toastService.show(
            err.error?.message || 'Gagal membatalkan pengajuan pinjaman.',
            'error'
          );
          this.selectedLoan = null;
          this.loadLoans();
        }
      })
    );
  }

  openDetailModal(loan: LoanTransaction): void {
    this.selectedLoan = loan;
  }

  closeDetailModal(): void {
    this.selectedLoan = null;
  }

  isOverdue(loan: LoanTransaction): boolean {
    if (loan.isOverdue !== undefined) return loan.isOverdue;
    if (loan.status !== 'AKTIF' || !loan.endDate) return false;
    return new Date(loan.endDate).getTime() < Date.now();
  }

  daysOverdue(loan: LoanTransaction): number {
    if (loan.daysOverdue) return loan.daysOverdue;
    if (!loan.endDate) return 0;
    const diff = Date.now() - new Date(loan.endDate).getTime();
    return Math.max(1, Math.ceil(diff / 86400000));
  }

  formatDate(dateIso?: string): string {
    if (!dateIso) return '—';
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
