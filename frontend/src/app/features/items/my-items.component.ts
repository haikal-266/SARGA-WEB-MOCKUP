import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Subscription, catchError, forkJoin, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ItemService } from '../../core/services/item.service';
import { LoanService } from '../../core/services/loan.service';
import { Item, ItemStatus, LoanTransaction } from '../../core/models';
import { AlertComponent } from '../../shared/alert/alert.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { LoanModalComponent, LoanRejectPayload } from '../../shared/loan-modal/loan-modal.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-my-items',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertComponent, StatusBadgeComponent, LoanModalComponent],
  template: `
    <div class="page page-mid">
      <header class="page-head split">
        <div>
          <p class="kicker">Pemilik</p>
          <h1>Barang saya dan permintaan masuk</h1>
          <p class="lede">
            Setujui permintaan pinjaman dan konfirmasi pengembalian tanpa mencari pesan lama.
          </p>
        </div>
        <div class="head-actions" *ngIf="currentUser() && isVerifiedMember()">
          <a class="btn-primary" routerLink="/barang/tambah">Daftarkan barang</a>
        </div>
      </header>

      <!-- Belum Masuk -->
      <div *ngIf="!currentUser(); else checkVerified" class="empty">
        <p class="empty-title">Masuk untuk mengelola barang</p>
        <p class="empty-body">Masuk sebagai anggota organisasi untuk melihat barang milik Anda dan permintaan masuk.</p>
        <a class="btn-primary empty-cta" routerLink="/auth/login">Masuk ke akun</a>
      </div>

      <!-- Belum Terverifikasi -->
      <ng-template #checkVerified>
        <div *ngIf="!isVerifiedMember(); else verifiedContent" class="stack">
          <app-alert
            kind="warning"
            title="Keanggotaan belum terverifikasi"
            message="Hanya anggota terverifikasi yang dapat menayangkan barang dan mengelola permintaan pinjaman."
          />
          <div>
            <a class="btn-primary" routerLink="/status-akun">Lihat status akun</a>
          </div>
        </div>
      </ng-template>

      <ng-template #verifiedContent>
        <!-- Stat Strip -->
        <div class="stat-strip">
          <div class="stat">
            <span class="stat-value">{{ displayItems().length }}</span>
            <span class="stat-label">Barang terdaftar</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ availableCount() }}</span>
            <span class="stat-label">Tersedia</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ pendingRequestsCount() }}</span>
            <span class="stat-label">Permintaan baru</span>
          </div>
        </div>

        <p *ngIf="loading" class="loading-text" role="status" aria-live="polite">
          Memuat barang dan permintaan masuk...
        </p>

        <app-alert
          *ngIf="errorMessage"
          kind="error"
          title="Data belum dapat dimuat"
          [message]="errorMessage"
        />

        <ng-container *ngIf="!loading && !errorMessage">
          <!-- Seksi 1: Permintaan Masuk -->
          <section aria-labelledby="incoming-heading">
            <div class="section-head">
              <h2 id="incoming-heading">Permintaan masuk</h2>
              <p>Pengajuan untuk barang yang Anda miliki.</p>
            </div>

            <div *ngIf="incomingRequests().length > 0; else emptyRequests" class="list">
              <article *ngFor="let loan of incomingRequests()" class="list-item">
                <div class="item-head">
                  <div>
                    <span class="cell-main">{{ loan.borrower?.fullName || 'Anggota' }}</span>
                    <span class="cell-sub">
                      {{ loan.item?.name || 'Barang' }} · {{ formatDate(loan.startDate) }} – {{ formatDate(loan.endDate) }}
                    </span>
                  </div>
                  <app-status-badge
                    kind="loan"
                    [status]="loan.status"
                    perspective="pemilik"
                    [overdue]="isOverdue(loan)"
                  />
                </div>

                <p class="small muted purpose-text">{{ loan.purpose }}</p>

                <div class="actions">
                  <button
                    class="btn-secondary btn-sm"
                    type="button"
                    (click)="openLoanModal(loan, false)"
                  >
                    Rincian transaksi
                  </button>

                  <ng-container *ngIf="loan.status === 'MENUNGGU'">
                    <button
                      class="btn-primary btn-sm"
                      type="button"
                      [disabled]="busyLoanId === loan.id"
                      (click)="approveLoan(loan)"
                    >
                      {{ busyLoanId === loan.id ? 'Memproses...' : 'Setujui' }}
                    </button>
                    <button
                      class="btn-danger btn-sm"
                      type="button"
                      [disabled]="busyLoanId === loan.id"
                      (click)="openLoanModal(loan, true)"
                    >
                      Tolak
                    </button>
                  </ng-container>

                  <button
                    *ngIf="loan.status === 'AKTIF'"
                    class="btn-primary btn-sm"
                    type="button"
                    [disabled]="busyLoanId === loan.id"
                    (click)="returnLoan(loan)"
                  >
                    {{ busyLoanId === loan.id ? 'Memproses...' : 'Konfirmasi Pengembalian' }}
                  </button>
                </div>
              </article>
            </div>

            <ng-template #emptyRequests>
              <div class="empty">
                <p class="empty-title">Tidak ada permintaan aktif</p>
                <p class="empty-body">
                  Permintaan baru akan muncul di sini setelah anggota mengajukan pinjaman.
                </p>
              </div>
            </ng-template>
          </section>

          <!-- Seksi 2: Daftar Barang -->
          <section class="section-rule" aria-labelledby="my-items-heading">
            <div class="section-head">
              <h2 id="my-items-heading">Daftar barang</h2>
              <p>Barang yang Anda tayangkan di katalog organisasi.</p>
            </div>

            <div *ngIf="displayItems().length > 0; else emptyItems" class="list">
              <article *ngFor="let item of displayItems()" class="list-item">
                <div class="item-head">
                  <div>
                    <span class="cell-main">
                      <a [routerLink]="['/katalog', item.id]">{{ item.name }}</a>
                    </span>
                    <span class="cell-sub">Kode barang: {{ item.code }}</span>
                  </div>
                  <app-status-badge kind="item" [status]="effectiveStatus(item)" />
                </div>

                <p class="small muted item-desc-line">{{ item.description }}</p>
                <p class="tiny muted item-counts">
                  {{ pendingCount(item.id) }} permintaan menunggu · {{ activeCount(item.id) }} sedang dipinjam
                </p>

                <div class="actions">
                  <a class="btn-secondary btn-sm" [routerLink]="['/katalog', item.id]">
                    Lihat rincian
                  </a>
                  <a class="btn-secondary btn-sm" [routerLink]="['/edit-barang', item.id]">
                    Ubah
                  </a>
                  <button
                    *ngIf="effectiveStatus(item) === 'DIARSIPKAN'; else archiveBtn"
                    class="btn-secondary btn-sm"
                    type="button"
                    (click)="restoreItem(item)"
                  >
                    Tayangkan lagi
                  </button>
                  <ng-template #archiveBtn>
                    <button
                      class="btn-danger btn-sm"
                      type="button"
                      (click)="archiveItem(item)"
                    >
                      Tarik dari katalog
                    </button>
                  </ng-template>
                </div>
              </article>
            </div>

            <ng-template #emptyItems>
              <div class="empty">
                <p class="empty-title">Belum ada barang</p>
                <p class="empty-body">
                  Daftarkan alat yang layak dipakai bersama. Anda tetap pemiliknya dan menentukan persetujuan pinjaman.
                </p>
                <a class="btn-primary empty-cta" routerLink="/barang/tambah">Daftarkan barang</a>
              </div>
            </ng-template>
          </section>
        </ng-container>
      </ng-template>

      <!-- Modal Rincian Transaksi & Tolak (FE-WLD-14) -->
      <app-loan-modal
        [open]="!!selectedLoan"
        [loan]="selectedLoan"
        [isAdmin]="authService.isAdmin()"
        [currentUserId]="currentUser()?.id || ''"
        [initialRejectMode]="rejectModalMode"
        [busy]="modalBusy"
        (closed)="closeLoanModal()"
        (approve)="approveFromModal($event)"
        (reject)="rejectFromModal($event)"
        (returnConfirm)="returnFromModal($event)"
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
    .section-head {
      margin-bottom: 1rem;
    }
    .section-head h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-ink);
    }
    .section-head p {
      margin: 0.25rem 0 0 0;
      font-size: 0.88rem;
      color: var(--color-muted);
    }
    .purpose-text,
    .item-desc-line,
    .item-counts {
      margin: 0;
    }
  `]
})
export class MyItemsComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly itemService = inject(ItemService);
  private readonly loanService = inject(LoanService);
  private readonly toastService = inject(ToastService);
  private subscription = new Subscription();

  currentUser = this.authService.currentUser;
  activeMembership = this.authService.activeMembership;

  private rawItems = signal<Item[]>([]);
  private rawLoans = signal<LoanTransaction[]>([]);
  private archiveTick = signal<number>(0);

  loading = false;
  errorMessage = '';
  busyLoanId = '';

  selectedLoan: LoanTransaction | null = null;
  rejectModalMode = false;
  modalBusy = false;

  isVerifiedMember = computed(() => {
    return this.activeMembership()?.status === 'TERVERIFIKASI';
  });

  displayItems = computed(() => {
    this.archiveTick();
    const userId = this.currentUser()?.id;
    if (!userId) return [];
    return this.rawItems().filter(item => item.ownerId === userId);
  });

  availableCount = computed(() => {
    return this.displayItems().filter(item => this.effectiveStatus(item) === 'TERSEDIA').length;
  });

  incomingRequests = computed(() => {
    const userId = this.currentUser()?.id;
    const ownedIds = new Set(this.displayItems().map(i => i.id));
    if (!userId) return [];
    return this.rawLoans()
      .filter(loan => {
        const isOwned = loan.ownerId === userId || ownedIds.has(loan.itemId);
        return isOwned && (loan.status === 'MENUNGGU' || loan.status === 'AKTIF');
      })
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  });

  pendingRequestsCount = computed(() => {
    return this.incomingRequests().filter(loan => loan.status === 'MENUNGGU').length;
  });

  ngOnInit(): void {
    if (this.currentUser() && this.isVerifiedMember()) {
      this.loadDashboard();
    } else {
      this.subscription.add(
        this.authService.currentUser$.subscribe(user => {
          if (user && this.isVerifiedMember() && this.rawItems().length === 0 && !this.loading) {
            this.loadDashboard();
          }
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadDashboard(): void {
    const user = this.currentUser();
    if (!user) return;
    this.loading = true;
    this.errorMessage = '';

    this.subscription.add(
      this.itemService.getItems().subscribe({
        next: itemsRes => {
          const allItems = (itemsRes.items || []).map(item => this.itemService.getEffectiveItem(item));
          this.rawItems.set(allItems);
          const myItems = allItems.filter(item => item.ownerId === user.id);

          if (this.authService.isAdmin()) {
            this.loanService.getOrganizationLoans().subscribe({
              next: loansRes => {
                this.rawLoans.set(loansRes.loans || []);
                this.loading = false;
              },
              error: () => {
                this.fetchLoansViaOwnedItems(myItems);
              }
            });
          } else {
            this.fetchLoansViaOwnedItems(myItems);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Gagal memuat daftar barang Anda.';
        }
      })
    );
  }

  private fetchLoansViaOwnedItems(myItems: Item[]): void {
    if (!myItems.length) {
      this.rawLoans.set([]);
      this.loading = false;
      return;
    }
    this.subscription.add(
      forkJoin(
        myItems.map(item =>
          this.itemService.getItemById(item.id).pipe(
            map(res => ({ item: res.item, loans: res.item.loans || [] })),
            catchError(() => of({ item, loans: [] }))
          )
        )
      ).subscribe({
        next: results => {
          const collected: LoanTransaction[] = [];
          for (const entry of results) {
            for (const loan of entry.loans) {
              collected.push({
                id: loan.id,
                orgId: loan.orgId,
                itemId: loan.itemId,
                borrowerId: loan.borrowerId,
                ownerId: loan.ownerId ?? entry.item.ownerId,
                startDate: loan.startDate,
                endDate: loan.endDate,
                status: loan.status as LoanTransaction['status'],
                purpose: loan.purpose,
                rejectionReason: loan.rejectionReason,
                returnConfirmedAt: loan.returnConfirmedAt,
                createdAt: loan.createdAt,
                updatedAt: loan.updatedAt,
                item: entry.item,
                borrower: loan.borrower
                  ? {
                    id: loan.borrower.id,
                    fullName: loan.borrower.fullName,
                    waNumber: loan.borrower.waNumber || ''
                  }
                  : undefined,
                owner: entry.item.owner
              });
            }
          }
          this.rawLoans.set(collected);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      })
    );
  }

  effectiveStatus(item: Item): ItemStatus {
    this.archiveTick();
    if (this.itemService.isLocallyArchived(item.id)) {
      return 'DIARSIPKAN';
    }
    return this.itemService.getEffectiveItem(item).status;
  }

  pendingCount(itemId: string): number {
    return this.rawLoans().filter(l => l.itemId === itemId && l.status === 'MENUNGGU').length;
  }

  activeCount(itemId: string): number {
    return this.rawLoans().filter(l => l.itemId === itemId && l.status === 'AKTIF').length;
  }

  approveLoan(loan: LoanTransaction): void {
    if (this.busyLoanId) return;
    if (this.itemService.isLocallyArchived(loan.itemId)) {
      this.toastService.show(
        'Barang tidak tayang: Tayangkan kembali barang sebelum menyetujui pinjaman.',
        'error'
      );
      return;
    }

    this.busyLoanId = loan.id;
    this.subscription.add(
      this.loanService.approveLoan(loan.id).subscribe({
        next: () => {
          this.busyLoanId = '';
          this.toastService.show(
            `Pinjaman disetujui: ${loan.borrower?.fullName || 'Peminjam'} dapat mengambil ${loan.item?.name || 'barang'}.`,
            'success'
          );
          this.loadDashboard();
        },
        error: (err: HttpErrorResponse) => {
          this.busyLoanId = '';
          this.toastService.show(
            err.error?.message || 'Gagal menyetujui pengajuan pinjaman.',
            'error'
          );
        }
      })
    );
  }

  returnLoan(loan: LoanTransaction): void {
    if (this.busyLoanId) return;
    this.busyLoanId = loan.id;
    this.subscription.add(
      this.loanService.returnLoan(loan.id).subscribe({
        next: () => {
          this.busyLoanId = '';
          this.toastService.show(
            `Pengembalian dicatat: ${loan.item?.name || 'Barang'} kembali tersedia di katalog.`,
            'success'
          );
          this.loadDashboard();
        },
        error: (err: HttpErrorResponse) => {
          this.busyLoanId = '';
          this.toastService.show(
            err.error?.message || 'Gagal mengonfirmasi pengembalian barang.',
            'error'
          );
        }
      })
    );
  }

  archiveItem(item: Item): void {
    const hasActiveLoan =
      item.status === 'DIPINJAM' ||
      this.rawLoans().some(l => l.itemId === item.id && l.status === 'AKTIF');

    if (hasActiveLoan) {
      this.toastService.show(
        'Masih dipinjam: Konfirmasi pengembalian sebelum menarik barang dari katalog.',
        'error'
      );
      return;
    }

    this.itemService.archiveItemLocally(item.id);
    this.archiveTick.update(n => n + 1);
    this.toastService.show(
      `Barang ditarik: ${item.name} tidak tampil di katalog sampai ditayangkan lagi.`,
      'info'
    );
  }

  restoreItem(item: Item): void {
    this.itemService.restoreItemLocally(item.id);
    this.archiveTick.update(n => n + 1);
    this.toastService.show(
      `Barang tayang lagi: ${item.name} kembali di katalog organisasi.`,
      'success'
    );
  }

  openLoanModal(loan: LoanTransaction, rejectMode: boolean): void {
    this.selectedLoan = loan;
    this.rejectModalMode = rejectMode;
  }

  closeLoanModal(): void {
    this.selectedLoan = null;
    this.rejectModalMode = false;
  }

  approveFromModal(loan: LoanTransaction): void {
    if (this.modalBusy) return;
    if (this.itemService.isLocallyArchived(loan.itemId)) {
      this.toastService.show(
        'Barang tidak tayang: Tayangkan kembali barang sebelum menyetujui pinjaman.',
        'error'
      );
      return;
    }
    this.modalBusy = true;
    this.subscription.add(
      this.loanService.approveLoan(loan.id).subscribe({
        next: () => {
          this.modalBusy = false;
          this.closeLoanModal();
          this.toastService.show(
            `Pinjaman disetujui: ${loan.borrower?.fullName || 'Peminjam'} dapat mengambil ${loan.item?.name || 'barang'}.`,
            'success'
          );
          this.loadDashboard();
        },
        error: (err: HttpErrorResponse) => {
          this.modalBusy = false;
          this.toastService.show(
            err.error?.message || 'Gagal menyetujui pengajuan pinjaman.',
            'error'
          );
        }
      })
    );
  }

  rejectFromModal(payload: LoanRejectPayload): void {
    if (this.modalBusy) return;
    this.modalBusy = true;
    this.subscription.add(
      this.loanService.rejectLoan(payload.loan.id, payload.reason).subscribe({
        next: () => {
          this.modalBusy = false;
          this.closeLoanModal();
          this.toastService.show(
            'Pengajuan ditolak: Peminjam bisa melihat alasan pada rincian transaksi.',
            'info'
          );
          this.loadDashboard();
        },
        error: (err: HttpErrorResponse) => {
          this.modalBusy = false;
          this.toastService.show(
            err.error?.message || 'Gagal menolak pengajuan pinjaman.',
            'error'
          );
        }
      })
    );
  }

  returnFromModal(loan: LoanTransaction): void {
    if (this.modalBusy) return;
    this.modalBusy = true;
    this.subscription.add(
      this.loanService.returnLoan(loan.id).subscribe({
        next: () => {
          this.modalBusy = false;
          this.closeLoanModal();
          this.toastService.show(
            `Pengembalian dicatat: ${loan.item?.name || 'Barang'} kembali tersedia di katalog.`,
            'success'
          );
          this.loadDashboard();
        },
        error: (err: HttpErrorResponse) => {
          this.modalBusy = false;
          this.toastService.show(
            err.error?.message || 'Gagal mengonfirmasi pengembalian barang.',
            'error'
          );
        }
      })
    );
  }

  isOverdue(loan: LoanTransaction): boolean {
    if (loan.isOverdue !== undefined) return loan.isOverdue;
    if (loan.status !== 'AKTIF' || !loan.endDate) return false;
    return new Date(loan.endDate).getTime() < Date.now();
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
