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
import { Membership } from '../../core/models';
import { MembershipService } from '../../core/services/membership.service';

@Component({
  selector: 'app-member-doc-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="open && membership"
      class="modal-backdrop"
      (click)="onBackdropClick($event)"
    >
      <div
        class="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-doc-modal-title"
      >
        <div class="modal-head">
          <h2 id="member-doc-modal-title">Verifikasi Calon Anggota: {{ applicantName }}</h2>
          <button
            #closeBtn
            type="button"
            class="modal-close"
            aria-label="Tutup dialog dokumen"
            (click)="close()"
          >
            ✕
          </button>
        </div>

        <div class="modal-body doc-modal-content">
          <div class="doc-modal-grid">
            <div class="doc-modal-info">
              <div class="item-head" style="margin-bottom:.75rem">
                <div>
                  <span class="cell-main" style="font-size:1.1rem">{{ applicantName }}</span>
                  <span class="cell-sub">{{ organizationName || 'Organisasi' }} · Diajukan {{ joinedDateLabel }}</span>
                </div>
                <span [class]="statusTagClass">{{ statusLabel }}</span>
              </div>

              <dl class="profile-list" style="margin-top:.75rem">
                <div class="profile-row">
                  <dt>Nomor HP / WhatsApp</dt>
                  <dd>
                    <a
                      *ngIf="waHref; else noWa"
                      class="link"
                      [href]="waHref"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ waNumber }} ↗ (Hubungi via WA)
                    </a>
                    <ng-template #noWa>—</ng-template>
                  </dd>
                </div>

                <div class="profile-row">
                  <dt>Alamat / Divisi</dt>
                  <dd>{{ applicantAddress }}</dd>
                </div>

                <div class="profile-row">
                  <dt>Jenis Dokumen</dt>
                  <dd><strong class="text-ink">{{ docType }}</strong></dd>
                </div>

                <div class="profile-row">
                  <dt>Nama Berkas</dt>
                  <dd class="mono small" style="word-break:break-all">{{ docName }}</dd>
                </div>

                <div class="profile-row" *ngIf="docNote">
                  <dt>Catatan Pemohon</dt>
                  <dd class="italic">{{ docNote }}</dd>
                </div>

                <div class="profile-row" *ngIf="fingerprint">
                  <dt>Sidik Jari Watermark</dt>
                  <dd class="mono small">{{ fingerprint }}</dd>
                </div>
              </dl>

              <div class="well" style="margin-top:1rem">
                <p class="small strong" style="margin:0">Acuan Pemeriksaan Pengurus</p>
                <p class="tiny muted" style="margin:.3rem 0 0">
                  Cocokkan nama lengkap, nomor HP, dan rincian identitas pada foto dokumen di samping dengan
                  catatan keanggotaan {{ organizationName || 'organisasi' }}.
                </p>
              </div>
            </div>

            <div class="doc-modal-preview">
              <div class="doc-preview-top">
                <span class="strong small">Foto Dokumen Keanggotaan</span>
                <a class="tiny link" [href]="docImage" target="_blank" rel="noopener noreferrer">
                  Buka Foto Asli ↗
                </a>
              </div>

              <div class="doc-preview-frame">
                <img
                  class="doc-preview-full"
                  [src]="docImage"
                  [alt]="'Dokumen verifikasi ' + applicantName"
                  (error)="onImgError($event)"
                />
              </div>

              <p class="tiny muted" style="text-align:center;margin:.55rem 0 0">
                Foto KTP / Kartu Anggota yang dilampirkan sebagai bukti verifikasi.
              </p>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" [disabled]="busy" (click)="close()">
            Tutup
          </button>

          <ng-container *ngIf="membership.status === 'MENUNGGU_VERIFIKASI'">
            <button
              type="button"
              class="btn-danger"
              [disabled]="busy"
              (click)="reject.emit(membership.id)"
            >
              ✕ Tolak Pendaftaran
            </button>
            <button
              type="button"
              class="btn-primary"
              [disabled]="busy"
              (click)="approve.emit(membership.id)"
            >
              {{ busy ? 'Menyetujui...' : '✓ Setujui Keanggotaan' }}
            </button>
          </ng-container>
        </div>
      </div>
    </div>
  `
})
export class MemberDocModalComponent implements OnChanges, OnDestroy {
  private readonly membershipService = inject(MembershipService);

  @Input() open = false;
  @Input() membership: Membership | null = null;
  @Input() organizationName = '';
  @Input() busy = false;

  @Output() closed = new EventEmitter<void>();
  @Output() approve = new EventEmitter<string>();
  @Output() reject = new EventEmitter<string>();

  @ViewChild('closeBtn') private closeBtn?: ElementRef<HTMLButtonElement>;

  private returnFocusEl: HTMLElement | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      document.body.classList.toggle('modal-open', this.open && !!this.membership);
      if (this.open) {
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

  get applicantName(): string {
    return this.membership?.user?.fullName || 'Calon Anggota';
  }

  get waNumber(): string {
    return this.membership?.user?.waNumber || '';
  }

  get waHref(): string | null {
    const digits = this.waNumber.replace(/\D/g, '');
    if (!digits) return null;
    const intl = digits.startsWith('62')
      ? digits
      : digits.startsWith('0')
        ? `62${digits.slice(1)}`
        : `62${digits}`;
    return `https://wa.me/${intl}`;
  }

  get applicantAddress(): string {
    return this.membership?.address || this.membership?.user?.address || 'Tidak dicantumkan';
  }

  private get cachedDoc() {
    if (!this.membership) return null;
    return this.membershipService.getDocumentPreview(this.membership.id, this.membership.user?.waNumber);
  }

  get docType(): string {
    return this.membership?.documentType || this.cachedDoc?.documentType || 'KTP / Kartu Identitas';
  }

  get docName(): string {
    return this.membership?.documentName || this.cachedDoc?.documentName || 'Dokumen_Keanggotaan.svg';
  }

  get docImage(): string {
    return this.membership?.documentUrl || this.cachedDoc?.documentUrl || '/img/sample-ktp.svg';
  }

  get docNote(): string {
    return this.membership?.documentNote || this.cachedDoc?.documentNote || '';
  }

  get fingerprint(): string {
    return this.cachedDoc?.fingerprint || '';
  }

  get joinedDateLabel(): string {
    const raw = this.membership?.joinedAt || this.membership?.createdAt;
    if (!raw) return 'baru-baru ini';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  get statusLabel(): string {
    if (this.membership?.status === 'TERVERIFIKASI') return 'Aktif';
    if (this.membership?.status === 'DITOLAK') return 'Ditolak';
    return 'Menunggu Verifikasi';
  }

  get statusTagClass(): string {
    if (this.membership?.status === 'TERVERIFIKASI') return 'tag-in';
    if (this.membership?.status === 'DITOLAK') return 'tag-danger';
    return 'tag-waiting';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open && !this.busy) {
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

  onImgError(event: Event): void {
    const img = event.target;
    if (img instanceof HTMLImageElement && !img.src.endsWith('/img/sample-ktp.svg')) {
      img.src = '/img/sample-ktp.svg';
    }
  }
}
