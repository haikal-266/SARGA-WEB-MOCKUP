import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Membership, Organization, Role, VerificationStatus } from '../../core/models';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-gabung',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Jika Belum Masuk -->
    <div *ngIf="!currentUser(); else loggedInView" class="page page-narrow">
      <header class="page-head">
        <p class="kicker">Gabung organisasi</p>
        <h1>Masuk terlebih dahulu</h1>
        <p class="lede">Keanggotaan terikat pada akun Anda.</p>
      </header>
      <div class="panel panel-pad">
        <p class="small">
          Silakan <a class="link" routerLink="/auth/login">masuk</a> atau
          <a class="link" routerLink="/auth/register">daftar</a>.
        </p>
      </div>
    </div>

    <!-- Jika Sudah Masuk -->
    <ng-template #loggedInView>
      <div class="page page-mid">
        <header class="page-head">
          <p class="kicker">Keanggotaan</p>
          <h1>Gabung organisasi lain</h1>
          <p class="lede">
            Satu akun bisa menjadi anggota beberapa organisasi. Setiap organisasi punya katalog dan pengurus sendiri.
          </p>
        </header>

        <div class="grid-2">
          <!-- Panel Kiri: Kode Undangan -->
          <div class="panel panel-pad">
            <h2 class="panel-heading">Kode undangan</h2>
            <form (ngSubmit)="onInviteSubmit()" novalidate>
              <div class="field">
                <label class="label" for="join-code">Kode dari pengurus</label>
                <input
                  #inviteInput
                  class="form-input mono"
                  id="join-code"
                  name="invite"
                  autocomplete="off"
                  autocapitalize="characters"
                  placeholder="Misal: NUSANTARA2026"
                  [(ngModel)]="inviteCode"
                  (ngModelChange)="inviteError = ''"
                  [attr.aria-invalid]="inviteError ? 'true' : null"
                  [attr.aria-describedby]="inviteError ? 'join-code-error join-code-hint' : 'join-code-hint'"
                  required
                />
                <p *ngIf="inviteError" id="join-code-error" class="error-text" role="alert">
                  {{ inviteError }}
                </p>
                <p id="join-code-hint" class="hint">
                  Masukkan kode undangan resmi yang diberikan oleh pengurus organisasi.
                </p>
              </div>
              <button class="btn-primary btn-block form-submit" type="submit">
                Ajukan keanggotaan
              </button>
            </form>
            <p class="hint join-modal-note">
              Setelah memasukkan kode valid, popup <strong>Formulir Data Diri Calon Anggota</strong> akan terbuka untuk
              melampirkan foto bukti keanggotaan tanpa perlu memasukkan kata sandi.
            </p>
          </div>

          <!-- Panel Kanan: Organisasi Anda -->
          <div class="panel panel-pad">
            <h2 class="panel-heading">Organisasi Anda</h2>

            <div *ngIf="memberships().length > 0; else emptyOrgs" class="list">
              <div *ngFor="let m of memberships()" class="list-item row">
                <div>
                  <span class="cell-main">
                    {{ m.organization?.name || ('Organisasi ' + m.orgId) }}
                  </span>
                  <span class="cell-sub">
                    {{ m.organization?.type || 'Organisasi' }} · {{ roleLabel(m.role) }} · sejak {{ formatJoinedDate(m.joinedAt) }}
                  </span>
                </div>
                <div class="actions">
                  <span [class]="statusTagClass(m.status)">{{ statusLabel(m.status) }}</span>
                  <button
                    *ngIf="m.status === 'TERVERIFIKASI'"
                    class="btn-secondary btn-sm"
                    type="button"
                    (click)="openOrg(m.orgId)"
                  >
                    Buka
                  </button>
                  <button
                    *ngIf="m.status === 'MENUNGGU_VERIFIKASI'"
                    class="btn-secondary btn-sm"
                    type="button"
                    (click)="openDocPreview(m)"
                  >
                    Lihat Dokumen
                  </button>
                </div>
              </div>
            </div>

            <ng-template #emptyOrgs>
              <div class="empty">
                <p class="empty-title">Belum ada organisasi</p>
                <p class="empty-body">Gunakan kode undangan dari pengurus untuk bergabung.</p>
              </div>
            </ng-template>
          </div>
        </div>

        <div class="well create-org-well">
          <p class="small strong">Ingin membuat organisasi baru?</p>
          <p class="small muted create-org-desc">
            Pembuatan organisasi hanya tersedia untuk admin platform.
          </p>
        </div>
      </div>
    </ng-template>

    <!-- Modal 1: Formulir Data Diri Calon Anggota (tanpa kata sandi) -->
    <div
      *ngIf="showJoinModal && targetOrg"
      class="modal-backdrop"
      (click)="onBackdropClick($event, 'join')"
    >
      <div
        #joinDialogEl
        class="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-modal-title"
        (keydown)="onDialogKeydown($event, joinDialogEl)"
      >
        <div class="modal-head">
          <h2 id="join-modal-title">Formulir Data Diri Calon Anggota</h2>
          <button
            class="modal-close"
            type="button"
            (click)="closeJoinModal()"
            aria-label="Tutup dialog"
          >
            ×
          </button>
        </div>

        <form (ngSubmit)="onSubmitJoinModal()" novalidate>
          <div class="modal-body modal-body-scroll">
            <div class="alert alert-info modal-info-alert">
              <strong>Pendaftaran ke {{ targetOrg.name }}</strong>
              <p>
                Pengurus akan memeriksa data diri dan foto bukti keanggotaan sebelum menyetujui akses Anda.
                Tidak perlu kata sandi baru karena Anda sudah memiliki akun.
              </p>
            </div>

            <div class="field">
              <label class="label" for="join-name">Nama lengkap</label>
              <input
                #joinNameInput
                class="form-input"
                id="join-name"
                name="name"
                type="text"
                autocomplete="name"
                [(ngModel)]="joinForm.fullName"
                (ngModelChange)="joinErrors.fullName = ''"
                [attr.aria-invalid]="joinErrors.fullName ? 'true' : null"
                [attr.aria-describedby]="joinErrors.fullName ? 'join-name-error join-name-hint' : 'join-name-hint'"
                required
              />
              <p *ngIf="joinErrors.fullName" id="join-name-error" class="error-text" role="alert">
                {{ joinErrors.fullName }}
              </p>
              <p id="join-name-hint" class="hint">
                Nama yang tertera pada identitas resmi atau catatan keanggotaan.
              </p>
            </div>

            <div class="field">
              <label class="label" for="join-wa">Nomor HP / WhatsApp</label>
              <input
                #joinWaInput
                class="form-input"
                id="join-wa"
                name="wa"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                [(ngModel)]="joinForm.waNumber"
                (ngModelChange)="joinErrors.waNumber = ''"
                [attr.aria-invalid]="joinErrors.waNumber ? 'true' : null"
                [attr.aria-describedby]="joinErrors.waNumber ? 'join-wa-error join-wa-hint' : 'join-wa-hint'"
                required
              />
              <p *ngIf="joinErrors.waNumber" id="join-wa-error" class="error-text" role="alert">
                {{ joinErrors.waNumber }}
              </p>
              <p id="join-wa-hint" class="hint">
                Nomor aktif untuk verifikasi dan konfirmasi pengurus {{ targetOrg.name }}.
              </p>
            </div>

            <div class="field">
              <label class="label" for="join-address">Alamat / Divisi / Unit Kerja</label>
              <input
                #joinAddressInput
                class="form-input"
                id="join-address"
                name="address"
                type="text"
                placeholder="Contoh: Divisi Operasional / Blok C No. 04"
                [(ngModel)]="joinForm.address"
                (ngModelChange)="joinErrors.address = ''"
                [attr.aria-invalid]="joinErrors.address ? 'true' : null"
                [attr.aria-describedby]="joinErrors.address ? 'join-address-error join-address-hint' : 'join-address-hint'"
                required
              />
              <p *ngIf="joinErrors.address" id="join-address-error" class="error-text" role="alert">
                {{ joinErrors.address }}
              </p>
              <p id="join-address-hint" class="hint">
                Lokasi tempat tinggal atau unit divisi Anda di lingkungan {{ targetOrg.name }}.
              </p>
            </div>

            <div class="field">
              <label class="label" for="join-doc-type">Jenis bukti keanggotaan</label>
              <select
                class="form-input"
                id="join-doc-type"
                name="documentType"
                [(ngModel)]="joinForm.documentType"
              >
                <option value="Kartu Tanda Anggota (KTA)">Kartu Tanda Anggota (KTA)</option>
                <option value="KTP (Kartu Tanda Penduduk)">KTP (Kartu Tanda Penduduk)</option>
                <option value="Kartu Identitas Karyawan">Kartu Identitas Pegawai / Karyawan</option>
                <option value="Surat Rekomendasi Pengurus">Surat Pengantar / Rekomendasi</option>
              </select>
            </div>

            <div class="field">
              <label class="label" for="join-document">Unggah foto bukti keanggotaan</label>
              <input
                class="form-input"
                id="join-document"
                name="document"
                type="file"
                accept="image/*,.pdf"
                (change)="onFileSelected($event)"
              />
            </div>

            <div class="doc-preview-box">
              <div class="doc-preview-header">
                <span class="small strong">Pratinjau Foto Dokumen</span>
                <span class="tag tag-in">{{ joinForm.docStatusTag }}</span>
              </div>
              <div class="doc-preview-img-wrap">
                <img
                  [src]="joinForm.documentUrl"
                  alt="Pratinjau Dokumen"
                  (error)="handleImageFallback($event)"
                />
              </div>
              <p class="tiny muted doc-filename">Berkas: {{ joinForm.documentName }}</p>
            </div>

            <div class="field note-field">
              <label class="label" for="join-doc-note">Catatan untuk pengurus (opsional)</label>
              <input
                class="form-input"
                id="join-doc-note"
                name="documentNote"
                type="text"
                placeholder="Contoh: Anggota aktif divisi timur sejak 2024"
                [(ngModel)]="joinForm.documentNote"
              />
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" type="button" (click)="closeJoinModal()">Batal</button>
            <button class="btn-primary form-submit-inline" type="submit">
              Kirim Formulir &amp; Dokumen
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 2: Lihat Dokumen Keanggotaan Menunggu -->
    <div
      *ngIf="viewedMembership"
      class="modal-backdrop"
      (click)="onBackdropClick($event, 'doc')"
    >
      <div
        #docDialogEl
        class="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-modal-title"
        (keydown)="onDialogKeydown($event, docDialogEl)"
      >
        <div class="modal-head">
          <h2 id="doc-modal-title">Dokumen Pengajuan: {{ viewedMembership.organization?.name || 'Organisasi' }}</h2>
          <button
            class="modal-close"
            type="button"
            (click)="closeDocPreview()"
            aria-label="Tutup dialog"
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <div class="doc-modal-grid">
            <div>
              <div class="doc-head-row">
                <div>
                  <span class="cell-main">{{ currentUser()?.fullName || currentUser()?.name }}</span>
                  <span class="cell-sub">
                    {{ viewedMembership.organization?.name }} · Diajukan {{ formatJoinedDate(viewedMembership.joinedAt) }}
                  </span>
                </div>
                <span [class]="statusTagClass(viewedMembership.status)">
                  {{ statusLabel(viewedMembership.status) }}
                </span>
              </div>

              <dl class="profile-list">
                <div class="profile-row">
                  <dt>Nomor HP / WhatsApp</dt>
                  <dd>{{ currentUser()?.waNumber }}</dd>
                </div>
                <div class="profile-row">
                  <dt>Alamat / Divisi</dt>
                  <dd>{{ viewedMembership.address || currentUser()?.address || 'Tidak dicantumkan' }}</dd>
                </div>
                <div class="profile-row">
                  <dt>Jenis Dokumen</dt>
                  <dd><strong>{{ viewedMembership.documentType || 'KTP / Kartu Identitas' }}</strong></dd>
                </div>
                <div class="profile-row">
                  <dt>Nama Berkas</dt>
                  <dd class="mono small doc-file-break">{{ viewedMembership.documentName || 'Dokumen_Keanggotaan.svg' }}</dd>
                </div>
                <div *ngIf="viewedMembership.documentNote" class="profile-row">
                  <dt>Catatan Pemohon</dt>
                  <dd class="italic">{{ viewedMembership.documentNote }}</dd>
                </div>
              </dl>
            </div>

            <div class="doc-modal-preview">
              <div class="doc-preview-top">
                <span class="strong small">Foto Dokumen Keanggotaan</span>
              </div>
              <div class="doc-preview-frame">
                <img
                  class="doc-preview-full"
                  [src]="resolveDocImg(viewedMembership.documentUrl)"
                  [alt]="'Dokumen ' + (currentUser()?.fullName || 'anggota')"
                  (error)="handleImageFallback($event)"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" type="button" (click)="closeDocPreview()">Tutup</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel-heading {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 0.75rem 0;
      color: var(--color-ink);
    }
    .join-modal-note {
      margin-top: 0.85rem;
    }
    .create-org-well {
      margin-top: 1.25rem;
    }
    .create-org-desc {
      margin-top: 0.25rem;
    }
    .modal-body-scroll {
      max-height: 75vh;
      overflow-y: auto;
    }
    .modal-info-alert {
      margin-bottom: 1rem;
    }
    .modal-info-alert p {
      margin-top: 0.25rem;
    }
    .sample-pills {
      margin-top: 0.45rem;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .doc-filename {
      margin-top: 0.4rem;
    }
    .note-field {
      margin-top: 0.85rem;
    }
    .form-submit-inline {
      margin-top: 0;
    }
    .doc-modal-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
    @media (min-width: 768px) {
      .doc-modal-grid {
        grid-template-columns: 1.1fr 1fr;
      }
    }
    .doc-head-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding-bottom: 0.75rem;
      margin-bottom: 0.75rem;
      border-bottom: 1px solid var(--color-rule);
    }
    .profile-list {
      display: grid;
      gap: 0.65rem;
      margin: 0;
    }
    .profile-row dt {
      color: var(--color-muted);
      font-size: 0.78rem;
      font-weight: 600;
    }
    .profile-row dd {
      margin: 0.15rem 0 0 0;
      font-size: 0.88rem;
      color: var(--color-ink);
    }
    .doc-file-break {
      word-break: break-all;
    }
    .doc-preview-top {
      margin-bottom: 0.5rem;
    }
  `]
})
export class GabungComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  @ViewChild('inviteInput') private inviteInput?: ElementRef<HTMLInputElement>;
  @ViewChild('joinNameInput') private joinNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('joinWaInput') private joinWaInput?: ElementRef<HTMLInputElement>;
  @ViewChild('joinAddressInput') private joinAddressInput?: ElementRef<HTMLInputElement>;

  currentUser = this.authService.currentUser;
  memberships = computed(() => this.currentUser()?.memberships || []);

  inviteCode = '';
  inviteError = '';

  showJoinModal = false;
  targetOrg: Organization | null = null;
  viewedMembership: Membership | null = null;

  joinForm = {
    fullName: '',
    waNumber: '',
    address: '',
    documentType: 'Kartu Tanda Anggota (KTA)',
    documentUrl: '/img/sample-kartu-anggota.svg',
    documentName: 'Kartu_Anggota_Calon.svg',
    documentNote: '',
    docStatusTag: 'Dokumen Siap Dikirim'
  };

  joinErrors = {
    fullName: '',
    waNumber: '',
    address: ''
  };

  private lastFocused: HTMLElement | null = null;

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showJoinModal) {
      this.closeJoinModal();
    } else if (this.viewedMembership) {
      this.closeDocPreview();
    }
  }

  onInviteSubmit(): void {
    const user = this.currentUser();
    if (!user) {
      this.inviteError = 'Sesi tidak ditemukan. Silakan masuk ulang.';
      return;
    }

    const code = this.inviteCode.trim().toUpperCase();
    const org = this.authService.resolveOrganizationByInvite(code);
    if (!org) {
      this.inviteError = 'Kode undangan tidak valid atau sudah kedaluwarsa.';
      this.inviteInput?.nativeElement.focus();
      return;
    }

    if (this.authService.hasMembershipInOrg(org)) {
      this.inviteError = 'Anda sudah terdaftar di organisasi ini.';
      this.inviteInput?.nativeElement.focus();
      return;
    }

    this.inviteError = '';
    this.openJoinModal(org);
  }

  openJoinModal(org: Organization): void {
    const user = this.currentUser();
    if (!user) return;
    this.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const existingDoc = user.memberships?.find(m => m.documentUrl || m.documentName);
    this.targetOrg = org;
    this.joinErrors = { fullName: '', waNumber: '', address: '' };
    this.joinForm = {
      fullName: user.fullName || user.name || '',
      waNumber: user.waNumber || '',
      address: user.address || '',
      documentType: 'Kartu Tanda Anggota (KTA)',
      documentUrl: this.resolveDocImg(existingDoc?.documentUrl) || '/img/sample-kartu-anggota.svg',
      documentName: existingDoc?.documentName || 'Kartu_Anggota_Calon.svg',
      documentNote: '',
      docStatusTag: 'Dokumen Siap Dikirim'
    };

    this.showJoinModal = true;
    document.body.classList.add('modal-open');
    setTimeout(() => this.joinNameInput?.nativeElement.focus(), 0);
  }

  closeJoinModal(): void {
    this.showJoinModal = false;
    this.targetOrg = null;
    this.restoreFocus();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.joinForm.documentName = file.name;
    this.joinForm.docStatusTag = 'Berkas Dipilih';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.joinForm.documentUrl = reader.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmitJoinModal(): void {
    const user = this.currentUser();
    const org = this.targetOrg;
    if (!user || !org) return;

    this.joinErrors = { fullName: '', waNumber: '', address: '' };

    const fullName = this.joinForm.fullName.trim();
    const waDigits = this.joinForm.waNumber.replace(/\D/g, '');
    const address = this.joinForm.address.trim();

    if (fullName.length < 3) {
      this.joinErrors.fullName = 'Isi nama lengkap minimal 3 karakter.';
      this.joinNameInput?.nativeElement.focus();
      return;
    }
    if (waDigits.length < 9) {
      this.joinErrors.waNumber = 'Nomor WhatsApp belum lengkap.';
      this.joinWaInput?.nativeElement.focus();
      return;
    }
    if (address.length < 3) {
      this.joinErrors.address = 'Isi alamat / divisi / unit kerja.';
      this.joinAddressInput?.nativeElement.focus();
      return;
    }

    const newMembership: Membership = {
      id: `m-local-${Date.now().toString(36)}`,
      userId: user.id,
      orgId: org.id,
      role: 'ANGGOTA',
      position: 'Anggota',
      status: 'MENUNGGU_VERIFIKASI',
      joinedAt: new Date().toISOString(),
      documentType: this.joinForm.documentType,
      documentName: this.joinForm.documentName,
      documentUrl: this.joinForm.documentUrl,
      documentNote:
        this.joinForm.documentNote.trim() || `Formulir pengajuan gabung organisasi ${org.name}.`,
      address,
      organization: org
    };

    const hasOtherActive = this.memberships().some(
      m => m.status === 'TERVERIFIKASI' && m.orgId !== org.id
    );

    this.authService.addAdditionalMembership(newMembership);
    this.inviteCode = '';
    this.closeJoinModal();

    if (!hasOtherActive) {
      this.authService.setActiveOrg(org.id);
      this.toastService.show(
        `Formulir & Dokumen Terkirim: Pengurus ${org.name} akan memeriksa data Anda.`,
        'success'
      );
      this.router.navigate(['/status-akun']);
    } else {
      this.toastService.show(
        `Formulir & Dokumen Terkirim: Pengajuan di ${org.name} sedang diverifikasi pengurus.`,
        'success'
      );
    }
  }

  openOrg(orgId: string): void {
    this.authService.setActiveOrg(orgId);
    const org = this.memberships().find(m => m.orgId === orgId)?.organization;
    this.toastService.show(
      `Organisasi aktif diubah ke ${org?.name || 'organisasi terpilih'}.`,
      'info'
    );
    this.router.navigate(['/katalog']);
  }

  openDocPreview(membership: Membership): void {
    this.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.viewedMembership = membership;
    document.body.classList.add('modal-open');
  }

  closeDocPreview(): void {
    this.viewedMembership = null;
    this.restoreFocus();
  }

  onBackdropClick(event: MouseEvent, type: 'join' | 'doc'): void {
    if (event.target !== event.currentTarget) return;
    if (type === 'join') {
      this.closeJoinModal();
    } else {
      this.closeDocPreview();
    }
  }

  onDialogKeydown(event: KeyboardEvent, dialogEl: HTMLElement): void {
    if (event.key !== 'Tab') return;
    const focusables = Array.from(
      dialogEl.querySelectorAll<HTMLElement>(
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

  roleLabel(role: Role): string {
    return role === 'ADMIN' ? 'Pengurus' : 'Anggota';
  }

  statusLabel(status: VerificationStatus): string {
    if (status === 'TERVERIFIKASI') return 'Aktif';
    if (status === 'DITOLAK') return 'Ditolak';
    return 'Menunggu Verifikasi';
  }

  statusTagClass(status: VerificationStatus): string {
    if (status === 'TERVERIFIKASI') return 'tag tag-in';
    if (status === 'DITOLAK') return 'tag tag-danger';
    return 'tag tag-waiting';
  }

  formatJoinedDate(dateIso?: string): string {
    if (!dateIso) return 'Baru saja';
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  resolveDocImg(url?: string): string {
    if (!url) return '/img/sample-kartu-anggota.svg';
    if (url.startsWith('assets/')) return '/' + url.slice('assets/'.length);
    if (url.startsWith('img/')) return '/' + url;
    return url;
  }

  handleImageFallback(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.includes('sample-kartu-anggota.svg')) {
      img.src = '/img/sample-kartu-anggota.svg';
    }
  }

  private restoreFocus(): void {
    document.body.classList.remove('modal-open');
    if (this.lastFocused && typeof this.lastFocused.focus === 'function') {
      const target = this.lastFocused;
      this.lastFocused = null;
      setTimeout(() => target.focus(), 0);
    }
  }
}
