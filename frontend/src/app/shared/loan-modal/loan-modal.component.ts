import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanTransaction } from '../../core/models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { Perspective } from '../status-badge/status-labels';
import { focusFirstInvalid } from '../utils/form-focus';

export interface LoanRejectPayload {
  loan: LoanTransaction;
  reason: string;
}

@Component({
  selector: 'app-loan-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  template: `
    <div
      *ngIf="open && loan"
      class="modal-backdrop"
      (click)="onBackdropClick($event)"
    >
      <div
        #dialogEl
        class="modal"
        [class.modal-wide]="!rejectMode"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loan-modal-title"
        (keydown)="onDialogKeydown($event)"
      >
        <div class="modal-head">
          <h2 id="loan-modal-title">
            {{ rejectMode ? 'Tolak pengajuan pinjaman' : 'Rincian transaksi' }}
          </h2>
          <button
            class="modal-close"
            type="button"
            (click)="close()"
            aria-label="Tutup dialog"
            [disabled]="busy"
          >
            ×
          </button>
        </div>

        <!-- Mode Tolak Pengajuan -->
        <form *ngIf="rejectMode; else detailView" (ngSubmit)="submitReject()" novalidate>
          <div class="modal-body">
            <p class="small">
              Pengajuan <span class="strong">{{ loan.borrower?.fullName || 'anggota' }}</span> untuk
              <span class="strong">{{ loan.item?.name || 'barang' }}</span> akan ditolak.
            </p>
            <div class="field reject-field">
              <label class="label" for="reject-loan-reason">Alasan penolakan</label>
              <textarea
                #reasonInput
                class="form-input"
                id="reject-loan-reason"
                name="reason"
                rows="4"
                placeholder="Contoh: barang sedang dipakai untuk kegiatan organisasi pada tanggal tersebut."
                [(ngModel)]="rejectReason"
                (ngModelChange)="rejectError = ''"
                [attr.aria-invalid]="rejectError ? 'true' : null"
                [attr.aria-describedby]="rejectError ? 'reject-loan-error' : null"
                required
              ></textarea>
              <p *ngIf="rejectError" id="reject-loan-error" class="error-text" role="alert">
                {{ rejectError }}
              </p>
            </div>
          </div>
          <div class="modal-actions">
            <button
              class="btn-secondary"
              type="button"
              (click)="exitRejectMode()"
              [disabled]="busy"
            >
              Batal
            </button>
            <button class="btn-danger" type="submit" [disabled]="busy">
              {{ busy ? 'Memproses...' : 'Tolak pengajuan' }}
            </button>
          </div>
        </form>

        <!-- Mode Rincian Transaksi & Linimasa Audit -->
        <ng-template #detailView>
          <div class="modal-body">
            <div class="item-head">
              <div>
                <span class="cell-main">{{ loan.item?.name || 'Barang dihapus' }}</span>
                <span class="cell-sub">
                  {{ loan.item?.code || '—' }} · {{ formatDate(loan.startDate) }} – {{ formatDate(loan.endDate) }}
                </span>
              </div>
              <app-status-badge
                kind="loan"
                [status]="loan.status"
                [perspective]="perspective"
                [overdue]="!!loan.isOverdue"
              />
            </div>

            <dl class="definition-list">
              <div>
                <dt>Peminjam</dt>
                <dd>{{ loan.borrower?.fullName || 'Anggota' }}</dd>
              </div>
              <div>
                <dt>Pemilik</dt>
                <dd>{{ loan.owner?.fullName || 'Aset organisasi' }}</dd>
              </div>
              <div>
                <dt>Keperluan</dt>
                <dd>{{ loan.purpose }}</dd>
              </div>
              <div *ngIf="loan.isOverdue">
                <dt>Keterlambatan</dt>
                <dd class="overdue-note">
                  Melewati batas kembali {{ loan.daysOverdue || 1 }} hari
                </dd>
              </div>
              <div *ngIf="loan.status === 'DITOLAK' && loan.rejectionReason">
                <dt>Alasan penolakan</dt>
                <dd>{{ loan.rejectionReason }}</dd>
              </div>
            </dl>

            <hr class="divider" />
            <h3 class="audit-heading">Jejak transaksi</h3>

            <ol class="timeline" aria-label="Linimasa jejak audit transaksi">
              <!-- Tahap 1: Pengajuan dikirim -->
              <li class="timeline-item done">
                <span class="timeline-dot" aria-hidden="true"></span>
                <div>
                  <strong>Pengajuan dikirim</strong>
                  <p>
                    {{ formatDateTime(loan.createdAt || loan.startDate) }} ·
                    {{ loan.borrower?.fullName || 'Anggota' }}
                  </p>
                  <p>{{ loan.purpose }}</p>
                </div>
              </li>

              <!-- Tahap berikutnya sesuai status -->
              <li *ngIf="loan.status === 'MENUNGGU'" class="timeline-item current">
                <span class="timeline-dot" aria-hidden="true"></span>
                <div>
                  <strong>Menunggu keputusan</strong>
                  <p>Pemilik atau pengurus belum menyetujui pengajuan ini.</p>
                </div>
              </li>

              <ng-container *ngIf="loan.status === 'AKTIF'">
                <li class="timeline-item done">
                  <span class="timeline-dot" aria-hidden="true"></span>
                  <div>
                    <strong>Menyetujui pinjaman</strong>
                    <p>
                      {{ loan.owner?.fullName || 'Pemilik / Pengurus' }} · Barang berstatus sedang dipinjam.
                    </p>
                  </div>
                </li>
                <li class="timeline-item" [ngClass]="loan.isOverdue ? 'rejected' : 'current'">
                  <span class="timeline-dot" aria-hidden="true"></span>
                  <div>
                    <strong>{{ loan.isOverdue ? 'Melewati batas kembali' : 'Sedang dipinjam' }}</strong>
                    <p>
                      Batas pengembalian: {{ formatDate(loan.endDate) }}
                      <ng-container *ngIf="loan.isOverdue">
                        (Terlambat {{ loan.daysOverdue || 1 }} hari)
                      </ng-container>
                    </p>
                  </div>
                </li>
              </ng-container>

              <ng-container *ngIf="loan.status === 'SELESAI'">
                <li class="timeline-item done">
                  <span class="timeline-dot" aria-hidden="true"></span>
                  <div>
                    <strong>Menyetujui pinjaman</strong>
                    <p>{{ loan.owner?.fullName || 'Pemilik / Pengurus' }} · Serah terima disetujui.</p>
                  </div>
                </li>
                <li class="timeline-item done">
                  <span class="timeline-dot" aria-hidden="true"></span>
                  <div>
                    <strong>Pengembalian dikonfirmasi</strong>
                    <p>
                      {{ formatDateTime(loan.returnConfirmedAt || loan.updatedAt || loan.endDate) }} ·
                      Barang kembali tersedia.
                    </p>
                  </div>
                </li>
              </ng-container>

              <li *ngIf="loan.status === 'DITOLAK'" class="timeline-item rejected">
                <span class="timeline-dot" aria-hidden="true"></span>
                <div>
                  <strong>Pengajuan ditolak</strong>
                  <p>{{ loan.rejectionReason || 'Alasan tercatat oleh pemilik atau pengurus.' }}</p>
                </div>
              </li>

              <li *ngIf="loan.status === 'DIBATALKAN'" class="timeline-item">
                <span class="timeline-dot" aria-hidden="true"></span>
                <div>
                  <strong>Dibatalkan peminjam</strong>
                  <p>Pengajuan tidak dilanjutkan.</p>
                </div>
              </li>
            </ol>
          </div>

          <div class="modal-actions">
            <button
              class="btn-secondary"
              type="button"
              (click)="close()"
              [disabled]="busy"
            >
              Tutup
            </button>

            <ng-container *ngIf="loan.status === 'MENUNGGU' && canManage">
              <button
                class="btn-danger"
                type="button"
                (click)="enterRejectMode()"
                [disabled]="busy"
              >
                Tolak
              </button>
              <button
                class="btn-primary"
                type="button"
                (click)="approve.emit(loan)"
                [disabled]="busy"
              >
                {{ busy ? 'Memproses...' : 'Setujui' }}
              </button>
            </ng-container>

            <button
              *ngIf="loan.status === 'MENUNGGU' && isBorrower && !canManage"
              class="btn-danger"
              type="button"
              (click)="cancel.emit(loan)"
              [disabled]="busy"
            >
              {{ busy ? 'Memproses...' : 'Batalkan pengajuan' }}
            </button>

            <button
              *ngIf="loan.status === 'MENUNGGU' && isBorrower && canManage"
              class="btn-danger"
              type="button"
              (click)="cancel.emit(loan)"
              [disabled]="busy"
            >
              Batalkan pengajuan
            </button>

            <button
              *ngIf="loan.status === 'AKTIF' && canManage"
              class="btn-primary"
              type="button"
              (click)="returnConfirm.emit(loan)"
              [disabled]="busy"
            >
              {{ busy ? 'Memproses...' : 'Konfirmasi pengembalian' }}
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .audit-heading {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 0 0 0.35rem 0;
      color: var(--color-ink);
    }
    .reject-field {
      margin-top: 0.9rem;
    }
    .overdue-note {
      color: var(--color-rose-ink);
      font-weight: 600;
    }
  `]
})
export class LoanModalComponent implements OnChanges, OnDestroy {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  @Input() open = false;
  @Input() loan: LoanTransaction | null = null;
  @Input() isAdmin = false;
  @Input() currentUserId = '';
  @Input() busy = false;
  @Input() initialRejectMode = false;

  @Output() closed = new EventEmitter<void>();
  @Output() approve = new EventEmitter<LoanTransaction>();
  @Output() reject = new EventEmitter<LoanRejectPayload>();
  @Output() cancel = new EventEmitter<LoanTransaction>();
  @Output() returnConfirm = new EventEmitter<LoanTransaction>();

  @ViewChild('dialogEl') private dialogEl?: ElementRef<HTMLElement>;
  @ViewChild('reasonInput') private reasonInput?: ElementRef<HTMLTextAreaElement>;

  rejectMode = false;
  rejectReason = '';
  rejectError = '';

  private lastFocused: HTMLElement | null = null;

  get canManage(): boolean {
    if (!this.loan) return false;
    return this.isAdmin || (!!this.currentUserId && this.loan.ownerId === this.currentUserId);
  }

  get isBorrower(): boolean {
    if (!this.loan || !this.currentUserId) return false;
    return this.loan.borrowerId === this.currentUserId;
  }

  get perspective(): Perspective {
    return this.isBorrower ? 'peminjam' : 'pemilik';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] || changes['initialRejectMode']) {
      if (this.open && this.loan) {
        this.onOpened();
      } else if (changes['open'] && !this.open) {
        this.restoreScrollAndFocus();
      }
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.open && !this.busy) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.busy) {
      this.close();
    }
  }

  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.dialogEl) return;
    const focusables = Array.from(
      this.dialogEl.nativeElement.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
      )
    ).filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  enterRejectMode(): void {
    this.rejectMode = true;
    this.rejectReason = '';
    this.rejectError = '';
    setTimeout(() => this.reasonInput?.nativeElement.focus(), 0);
  }

  exitRejectMode(): void {
    if (this.initialRejectMode) {
      this.close();
      return;
    }
    this.rejectMode = false;
    this.rejectError = '';
  }

  submitReject(): void {
    if (!this.loan || this.busy) return;
    const reason = this.rejectReason.trim();
    if (reason.length < 5) {
      this.rejectError = 'Tuliskan alasan penolakan minimal 5 karakter.';
      focusFirstInvalid(this.hostEl.nativeElement);
      return;
    }
    this.reject.emit({ loan: this.loan, reason });
  }

  close(): void {
    this.rejectMode = false;
    this.rejectReason = '';
    this.rejectError = '';
    this.restoreScrollAndFocus();
    this.closed.emit();
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

  formatDateTime(dateIso?: string): string {
    if (!dateIso) return '—';
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private onOpened(): void {
    if (!this.lastFocused && document.activeElement instanceof HTMLElement) {
      this.lastFocused = document.activeElement;
    }
    this.rejectMode = this.initialRejectMode;
    this.rejectReason = '';
    this.rejectError = '';
    document.body.classList.add('modal-open');

    setTimeout(() => {
      if (this.rejectMode && this.reasonInput) {
        this.reasonInput.nativeElement.focus();
      } else if (this.dialogEl) {
        const closeBtn = this.dialogEl.nativeElement.querySelector<HTMLElement>('.modal-close');
        closeBtn?.focus();
      }
    }, 0);
  }

  private restoreScrollAndFocus(): void {
    document.body.classList.remove('modal-open');
    if (this.lastFocused && typeof this.lastFocused.focus === 'function') {
      const target = this.lastFocused;
      this.lastFocused = null;
      setTimeout(() => target.focus(), 0);
    }
  }
}
