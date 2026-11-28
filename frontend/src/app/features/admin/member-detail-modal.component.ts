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
import { RouterLink } from '@angular/router';
import { LoanTransaction, Role, VerificationStatus } from '../../core/models';
import { AlertComponent } from '../../shared/alert/alert.component';
import { CustomSelectComponent, SelectOption } from '../../shared/custom-select/custom-select.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { focusFirstInvalid } from '../../shared/utils/form-focus';

export interface MemberDirectoryRow {
  id: string;
  userId: string;
  fullName: string;
  waNumber: string;
  role: Role;
  position: string;
  status: VerificationStatus;
  joinedAt: string;
  address?: string;
  isLocalOnly: boolean;
}

@Component({
  selector: 'app-member-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertComponent, CustomSelectComponent, StatusBadgeComponent],
  template: `
    <div *ngIf="member" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="member-edit-modal-title">
        <div class="modal-head">
          <div>
            <h2 id="member-edit-modal-title">{{ member.fullName }}</h2>
            <p class="tiny muted" style="margin:.2rem 0 0">
              {{ member.role === 'ADMIN' ? 'Pengurus' : 'Anggota' }} · {{ member.position }}
            </p>
          </div>
          <button #closeBtn type="button" class="modal-close" aria-label="Tutup dialog" (click)="close()">
            ✕
          </button>
        </div>

        <form (ngSubmit)="submit()" novalidate>
          <div class="modal-body">
            <dl class="profile-list">
              <div class="profile-row">
                <dt>WhatsApp</dt>
                <dd>
                  <a *ngIf="waHref; else plainWa" class="link" [href]="waHref" target="_blank" rel="noopener noreferrer">
                    {{ member.waNumber }} ↗ (Hubungi Anggota)
                  </a>
                  <ng-template #plainWa>{{ member.waNumber }}</ng-template>
                </dd>
              </div>
              <div class="profile-row" *ngIf="member.address">
                <dt>Alamat / Unit</dt>
                <dd>{{ member.address }}</dd>
              </div>
              <div class="profile-row">
                <dt>Status keanggotaan</dt>
                <dd><span [class]="statusTagClass">{{ statusLabel }}</span></dd>
              </div>
              <div class="profile-row">
                <dt>Tanggal bergabung</dt>
                <dd>{{ formatDate(member.joinedAt) }}</dd>
              </div>
            </dl>

            <app-alert
              *ngIf="errorText"
              kind="error"
              title="Perubahan tidak dapat disimpan"
              [message]="errorText"
              style="display:block;margin-top:.9rem"
            />

            <div *ngIf="member.status === 'MENUNGGU_VERIFIKASI'" class="well" style="margin-top:.9rem">
              <p class="small strong" style="margin:0">Calon anggota menunggu verifikasi</p>
              <p class="tiny muted" style="margin:.3rem 0 .6rem">
                Perubahan peran hanya berlaku untuk anggota terverifikasi. Periksa dokumen di Pusat Verifikasi.
              </p>
              <a class="btn-secondary btn-sm" routerLink="/admin-verifikasi" (click)="close()">
                Buka Pusat Verifikasi
              </a>
            </div>

            <div *ngIf="member.status === 'TERVERIFIKASI'" style="margin-top:1rem">
              <div class="field">
                <label class="label" for="edit-member-role">Peran di organisasi</label>
                <app-select
                  id="edit-member-role"
                  name="role"
                  [options]="roleOptions"
                  [invalid]="roleError"
                  [(ngModel)]="role"
                  (ngModelChange)="roleError = false; localError = ''"
                />
                <p *ngIf="singleAdminAtRisk" class="hint" style="color:var(--color-rose-ink)">
                  Proteksi pengurus tunggal: organisasi harus memiliki minimal satu Pengurus aktif.
                </p>
              </div>

              <div class="field">
                <label class="label" for="edit-member-position">Posisi di bagan</label>
                <input
                  class="form-input"
                  [class.is-invalid]="!!positionError"
                  [attr.aria-invalid]="!!positionError"
                  id="edit-member-position"
                  name="position"
                  type="text"
                  maxlength="50"
                  required
                  [(ngModel)]="position"
                  (ngModelChange)="positionError = ''; localError = ''"
                />
                <p *ngIf="positionError" class="error-text">{{ positionError }}</p>
              </div>
            </div>

            <div style="margin-top:1.1rem">
              <p class="small strong" style="margin:0 0 .5rem">Pinjaman anggota ini ({{ memberLoans.length }})</p>
              <div *ngIf="memberLoans.length > 0; else noMemberLoans" class="list">
                <div class="list-item row" *ngFor="let loan of memberLoans">
                  <div>
                    <span class="cell-main">{{ loan.item?.name || 'Barang' }}</span>
                    <span class="cell-sub">{{ formatDate(loan.startDate) }} – {{ formatDate(loan.endDate) }}</span>
                  </div>
                  <app-status-badge kind="loan" [status]="loan.status" perspective="peminjam" />
                </div>
              </div>
              <ng-template #noMemberLoans>
                <p class="tiny muted" style="margin:0">Belum ada pinjaman tercatat pada organisasi ini.</p>
              </ng-template>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" [disabled]="saving" (click)="close()">Tutup</button>
            <button *ngIf="member.status === 'TERVERIFIKASI'" type="submit" class="btn-primary" [disabled]="saving">
              {{ saving ? 'Menyimpan...' : 'Simpan perubahan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class MemberDetailModalComponent implements OnChanges, OnDestroy {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  @Input() member: MemberDirectoryRow | null = null;
  @Input() memberLoans: LoanTransaction[] = [];
  @Input() verifiedAdminCount = 0;
  @Input() saving = false;
  @Input() serverError = '';

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{ role: Role; position: string }>();

  @ViewChild('closeBtn') private closeBtn?: ElementRef<HTMLButtonElement>;

  readonly roleOptions: ReadonlyArray<SelectOption> = [
    { value: 'ADMIN', label: 'Pengurus' },
    { value: 'ANGGOTA', label: 'Anggota' }
  ];

  role: Role = 'ANGGOTA';
  position = 'Anggota';
  localError = '';
  positionError = '';
  roleError = false;
  private returnFocusEl: HTMLElement | null = null;

  get errorText(): string {
    return this.localError || this.serverError;
  }

  get singleAdminAtRisk(): boolean {
    return (
      !!this.member &&
      !this.member.isLocalOnly &&
      this.member.role === 'ADMIN' &&
      this.role !== 'ADMIN' &&
      this.verifiedAdminCount <= 1
    );
  }

  get waHref(): string | null {
    const digits = (this.member?.waNumber || '').replace(/\D/g, '');
    if (!digits) return null;
    const intl = digits.startsWith('62')
      ? digits
      : digits.startsWith('0')
        ? `62${digits.slice(1)}`
        : `62${digits}`;
    return `https://wa.me/${intl}`;
  }

  get statusLabel(): string {
    if (this.member?.status === 'TERVERIFIKASI') return 'Aktif';
    if (this.member?.status === 'DITOLAK') return 'Ditolak';
    return 'Menunggu Verifikasi';
  }

  get statusTagClass(): string {
    if (this.member?.status === 'TERVERIFIKASI') return 'tag-in';
    if (this.member?.status === 'DITOLAK') return 'tag-danger';
    return 'tag-waiting';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['member']) {
      document.body.classList.toggle('modal-open', !!this.member);
      if (this.member) {
        this.role = this.member.role;
        this.position = this.member.position || 'Anggota';
        this.localError = '';
        this.positionError = '';
        this.roleError = false;
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
    if (this.member && !this.saving) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.saving) {
      this.close();
    }
  }

  close(): void {
    if (this.saving) return;
    this.closed.emit();
  }

  submit(): void {
    if (this.saving) return;
    const trimmedPos = this.position.trim();
    this.positionError =
      !trimmedPos || trimmedPos.length > 50 ? 'Posisi di bagan wajib diisi (1–50 karakter).' : '';
    this.roleError = this.singleAdminAtRisk;

    if (this.positionError || this.roleError) {
      this.localError = this.roleError
        ? 'Organisasi harus punya minimal satu Pengurus aktif. Angkat anggota lain terlebih dahulu.'
        : this.positionError;
      focusFirstInvalid(this.hostEl.nativeElement);
      return;
    }
    this.localError = '';
    this.saved.emit({ role: this.role, position: trimmedPos });
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
