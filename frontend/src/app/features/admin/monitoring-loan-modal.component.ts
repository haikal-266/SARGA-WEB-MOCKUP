import { CommonModule } from '@angular/common';
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
import { FormsModule } from '@angular/forms';
import { LoanTransaction } from '../../core/models';
import { AlertComponent } from '../../shared/alert/alert.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { focusFirstInvalid } from '../../shared/utils/form-focus';

@Component({
  selector: 'app-monitoring-loan-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent, StatusBadgeComponent],
  template: `
    <div *ngIf="loan" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="monitoring-loan-title">
        <div class="modal-head">
          <div>
            <h2 id="monitoring-loan-title">{{ loan.item?.name || 'Rincian transaksi' }}</h2>
            <p class="tiny mono muted" style="margin:.2rem 0 0">{{ loan.item?.code || loan.id }}</p>
          </div>
          <button #closeBtn type="button" class="modal-close" aria-label="Tutup dialog" (click)="close()">
            ✕
          </button>
        </div>

        <div class="modal-body">
          <div style="margin-bottom:.9rem">
            <app-status-badge kind="loan" [status]="loan.status" perspective="pemilik" [overdue]="overdue" />
          </div>

          <dl class="profile-list">
            <div class="profile-row">
              <dt>Peminjam</dt>
              <dd>{{ loan.borrower?.fullName || 'Anggota' }} ({{ loan.borrower?.waNumber || '-' }})</dd>
            </div>
            <div class="profile-row">
              <dt>Pemilik</dt>
              <dd>{{ loan.owner?.fullName || loan.item?.owner?.fullName || 'Aset organisasi' }}</dd>
            </div>
            <div class="profile-row">
              <dt>Rentang tanggal</dt>
              <dd>{{ formatDate(loan.startDate) }} – {{ formatDate(loan.endDate) }}</dd>
            </div>
            <div class="profile-row">
              <dt>Keperluan</dt>
              <dd>{{ loan.purpose }}</dd>
            </div>
            <div class="profile-row" *ngIf="loan.rejectionReason">
              <dt>Alasan penolakan</dt>
              <dd>{{ loan.rejectionReason }}</dd>
            </div>
          </dl>

          <div class="well" style="margin-top:1rem">
            <p class="small strong" style="margin:0">Linimasa Jejak Audit</p>
            <ol class="timeline">
              <li class="timeline-item done">
                <span class="timeline-dot" aria-hidden="true"></span>
                <div>
                  <strong class="small">Pengajuan diterima sistem</strong>
                  <p class="tiny muted" style="margin:.1rem 0 0">Diajukan oleh {{ loan.borrower?.fullName || 'anggota' }} · {{ formatDate(loan.createdAt || loan.startDate) }}</p>
                </div>
              </li>
              <li
                class="timeline-item"
                [class.done]="loan.status === 'AKTIF' || loan.status === 'DISETUJUI' || loan.status === 'SELESAI'"
                [class.current]="loan.status === 'MENUNGGU'"
                [class.danger]="loan.status === 'DITOLAK' || loan.status === 'DIBATALKAN'"
              >
                <span class="timeline-dot" aria-hidden="true"></span>
                <div>
                  <strong class="small">{{ decisionTitle }}</strong>
                  <p class="tiny muted" style="margin:.1rem 0 0">{{ decisionDetail }}</p>
                </div>
              </li>
              <li class="timeline-item" [class.done]="loan.status === 'SELESAI'">
                <span class="timeline-dot" aria-hidden="true"></span>
                <div>
                  <strong class="small">Konfirmasi pengembalian</strong>
                  <p class="tiny muted" style="margin:.1rem 0 0">
                    {{ loan.returnConfirmedAt ? 'Dikembalikan pada ' + formatDate(loan.returnConfirmedAt) : 'Menunggu konfirmasi serah kembali fisik.' }}
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <app-alert
            *ngIf="errorMessage"
            kind="error"
            title="Aksi gagal"
            [message]="errorMessage"
            style="display:block;margin-top:.9rem"
          />

          <div *ngIf="rejectMode && loan.status === 'MENUNGGU'" class="field" style="margin-top:1rem">
            <label class="label" for="monitoring-reject-reason">Alasan penolakan (minimal 5 karakter)</label>
            <textarea
              class="form-input"
              [class.is-invalid]="!!rejectError"
              [attr.aria-invalid]="!!rejectError"
              id="monitoring-reject-reason"
              rows="3"
              placeholder="Contoh: barang sedang digunakan untuk kegiatan organisasi."
              [(ngModel)]="rejectReason"
              (ngModelChange)="rejectError = ''"
            ></textarea>
            <p *ngIf="rejectError" class="error-text">{{ rejectError }}</p>
          </div>

          <div *ngIf="loan.status === 'DISETUJUI' || loan.status === 'AKTIF'" class="field" style="margin-top:1rem">
            <label class="label" for="monitoring-return-note">Catatan kondisi barang saat kembali (opsional)</label>
            <input
              class="form-input"
              id="monitoring-return-note"
              type="text"
              placeholder="Contoh: Kembali lengkap dan bersih"
              [(ngModel)]="conditionNote"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" [disabled]="busy" (click)="close()">Tutup</button>

          <a
            *ngIf="reminderHref && (loan.status === 'AKTIF' || loan.status === 'DISETUJUI')"
            class="btn-secondary"
            [href]="reminderHref"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ingatkan via WA ↗
          </a>

          <ng-container *ngIf="loan.status === 'MENUNGGU'">
            <button *ngIf="!rejectMode" type="button" class="btn-danger" [disabled]="busy" (click)="rejectMode = true; rejectError = ''">
              Tolak
            </button>
            <button *ngIf="rejectMode" type="button" class="btn-danger" [disabled]="busy" (click)="onConfirmReject()">
              {{ busy ? 'Menolak...' : 'Konfirmasi Penolakan' }}
            </button>
            <button type="button" class="btn-primary" [disabled]="busy" (click)="approve.emit(loan.id)">
              {{ busy ? 'Menyetujui...' : 'Setujui' }}
            </button>
          </ng-container>

          <button
            *ngIf="loan.status === 'DISETUJUI' || loan.status === 'AKTIF'"
            type="button"
            class="btn-primary"
            [disabled]="busy"
            (click)="returnLoan.emit({ loanId: loan.id, conditionNote })"
          >
            {{ busy ? 'Memproses...' : 'Konfirmasi Pengembalian' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class MonitoringLoanModalComponent implements OnChanges, OnDestroy {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  @Input() loan: LoanTransaction | null = null;
  @Input() overdue = false;
  @Input() busy = false;
  @Input() errorMessage = '';
  @Input() reminderHref: string | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() approve = new EventEmitter<string>();
  @Output() reject = new EventEmitter<{ loanId: string; reason: string }>();
  @Output() returnLoan = new EventEmitter<{ loanId: string; conditionNote: string }>();

  @ViewChild('closeBtn') private closeBtn?: ElementRef<HTMLButtonElement>;

  rejectMode = false;
  rejectReason = '';
  rejectError = '';
  conditionNote = '';
  private returnFocusEl: HTMLElement | null = null;

  get decisionTitle(): string {
    const status = this.loan?.status;
    if (status === 'DITOLAK') return 'Pengajuan ditolak';
    if (status === 'DIBATALKAN') return 'Pengajuan dibatalkan peminjam';
    if (status === 'MENUNGGU') return 'Menunggu keputusan pemilik / pengurus';
    return 'Pengajuan disetujui';
  }

  get decisionDetail(): string {
    const status = this.loan?.status;
    if (status === 'DITOLAK') return this.loan?.rejectionReason || 'Ditolak oleh pemilik atau pengurus.';
    if (status === 'DIBATALKAN') return 'Dibatalkan sebelum disetujui.';
    if (status === 'MENUNGGU') return 'Belum ada keputusan persetujuan.';
    return `Dipinjam hingga ${this.formatDate(this.loan?.endDate)}.`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loan']) {
      document.body.classList.toggle('modal-open', !!this.loan);
      if (this.loan) {
        this.rejectMode = false;
        this.rejectReason = '';
        this.conditionNote = '';
        this.returnFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setTimeout(() => this.closeBtn?.nativeElement.focus());
      } else if (this.returnFocusEl) {
        const el = this.returnFocusEl;
        this.returnFocusEl = null;
        setTimeout(() => el.focus());
      }
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.loan && !this.busy) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.busy) {
      this.close();
    }
  }

  close(): void {
    if (this.busy) return;
    this.closed.emit();
  }

  onConfirmReject(): void {
    if (!this.loan || this.busy) return;
    const reason = this.rejectReason.trim();
    if (reason.length < 5) {
      this.rejectError = 'Alasan penolakan minimal 5 karakter.';
      this.errorMessage = this.rejectError;
      focusFirstInvalid(this.hostEl.nativeElement);
      return;
    }
    this.rejectError = '';
    this.reject.emit({ loanId: this.loan.id, reason });
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
