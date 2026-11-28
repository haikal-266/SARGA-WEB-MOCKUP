import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ItemService, normalizeItemImagePath } from '../../core/services/item.service';
import { LoanService } from '../../core/services/loan.service';
import { Item, LoanTransaction } from '../../core/models';
import { AlertComponent } from '../../shared/alert/alert.component';
import { CustomSelectComponent, SelectOption } from '../../shared/custom-select/custom-select.component';
import { ToastService } from '../../shared/toast/toast.service';
import { focusFirstInvalid } from '../../shared/utils/form-focus';

@Component({
  selector: 'app-loan-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertComponent, CustomSelectComponent],
  template: `
    <div class="page page-mid">
      <header class="page-head">
        <p class="kicker">Peminjam · UC-PJ-02</p>
        <h1>Formulir pengajuan pinjaman</h1>
        <p class="lede">
          Isi tanggal dan keperluan. Pemilik atau pengurus akan menyetujui dari daftar permintaan.
        </p>
      </header>

      <!-- Belum Masuk -->
      <div *ngIf="!currentUser(); else checkVerified" class="empty">
        <p class="empty-title">Masuk terlebih dahulu</p>
        <p class="empty-body">Masuk sebagai anggota organisasi untuk mengajukan pinjaman.</p>
        <a class="btn-primary empty-cta" routerLink="/auth/login">Masuk ke akun</a>
      </div>

      <!-- Cek Status Verifikasi -->
      <ng-template #checkVerified>
        <div *ngIf="!isVerifiedMember(); else verifiedContent" class="stack">
          <app-alert
            kind="warning"
            title="Keanggotaan belum terverifikasi"
            message="Anggota yang belum berstatus Aktif belum dapat mengajukan pinjaman barang. Periksa status pendaftaran Anda terlebih dahulu."
          />
          <div>
            <a class="btn-primary" routerLink="/status-akun">Lihat status akun</a>
          </div>
        </div>
      </ng-template>

      <!-- Konten Terverifikasi -->
      <ng-template #verifiedContent>
        <p *ngIf="loading" class="loading-text" role="status" aria-live="polite">
          Memuat daftar alat tersedia...
        </p>

        <app-alert
          *ngIf="loadError"
          kind="error"
          title="Gagal memuat data"
          [message]="loadError"
        />

        <app-alert
          *ngIf="requestedWarning"
          kind="warning"
          title="Perhatian alat pilihan"
          [message]="requestedWarning"
        />

        <div *ngIf="!loading && !loadError && eligibleItems().length === 0" class="empty">
          <p class="empty-title">Belum ada alat yang bisa diajukan</p>
          <p class="empty-body">
            Semua alat sedang dipinjam, milik Anda sendiri, atau Anda sudah punya pengajuan menunggu untuk alat tersebut.
          </p>
          <a class="btn-primary empty-cta" routerLink="/katalog">Kembali ke katalog</a>
        </div>

        <div *ngIf="!loading && !loadError && eligibleItems().length > 0" class="grid-2">
          <!-- Kolom Kiri: Formulir -->
          <div class="panel panel-pad">
            <form (ngSubmit)="onSubmit()" novalidate [attr.aria-busy]="submitting">
              <div *ngIf="formErrors.summary" class="alert alert-danger form-error-summary" role="alert">
                <strong>Periksa isian</strong>
                <p>{{ formErrors.summary }}</p>
              </div>

              <div class="field">
                <label class="label" for="loan-item">Alat yang diajukan</label>
                <app-select
                  #itemSelect
                  id="loan-item"
                  name="item"
                  [options]="eligibleItemOptions()"
                  [(ngModel)]="form.itemId"
                  (ngModelChange)="onItemChanged()"
                  [invalid]="!!formErrors.item"
                  [ariaDescribedby]="formErrors.item ? 'loan-item-error' : ''"
                />
                <p *ngIf="formErrors.item" id="loan-item-error" class="error-text" role="alert">
                  {{ formErrors.item }}
                </p>
              </div>

              <div class="form-grid two date-grid">
                <div class="field">
                  <label class="label" for="loan-start">Tanggal mulai</label>
                  <input
                    #startInput
                    class="form-input"
                    id="loan-start"
                    name="start"
                    type="date"
                    [min]="todayIso"
                    [(ngModel)]="form.start"
                    (ngModelChange)="onStartDateChanged()"
                    [attr.aria-invalid]="formErrors.start ? 'true' : null"
                    [attr.aria-describedby]="formErrors.start ? 'loan-start-error' : null"
                    required
                  />
                  <p *ngIf="formErrors.start" id="loan-start-error" class="error-text" role="alert">
                    {{ formErrors.start }}
                  </p>
                </div>

                <div class="field">
                  <label class="label" for="loan-end">Tanggal kembali</label>
                  <input
                    #endInput
                    class="form-input"
                    id="loan-end"
                    name="end"
                    type="date"
                    [min]="form.start || todayIso"
                    [(ngModel)]="form.end"
                    (ngModelChange)="formErrors.end = ''; formErrors.summary = ''"
                    [attr.aria-invalid]="formErrors.end ? 'true' : null"
                    [attr.aria-describedby]="formErrors.end ? 'loan-end-error' : null"
                    required
                  />
                  <p *ngIf="formErrors.end" id="loan-end-error" class="error-text" role="alert">
                    {{ formErrors.end }}
                  </p>
                </div>
              </div>

              <p *ngIf="selectedItem()" class="hint duration-hint" aria-live="polite">
                Estimasi durasi:
                <strong>{{ durationDays() !== null ? durationDays() + ' hari' : '—' }}</strong>
                (maksimal {{ selectedItem()?.maxDays }} hari).
              </p>

              <div class="field">
                <label class="label" for="loan-purpose">Keperluan peminjaman</label>
                <textarea
                  #purposeInput
                  class="form-input"
                  id="loan-purpose"
                  name="purpose"
                  rows="4"
                  placeholder="Contoh: memperbaiki kusen pintu kamar sebelum akhir bulan."
                  [(ngModel)]="form.purpose"
                  (ngModelChange)="formErrors.purpose = ''; formErrors.summary = ''"
                  [attr.aria-invalid]="formErrors.purpose ? 'true' : null"
                  [attr.aria-describedby]="formErrors.purpose ? 'loan-purpose-error loan-purpose-hint' : 'loan-purpose-hint'"
                  required
                ></textarea>
                <p *ngIf="formErrors.purpose" id="loan-purpose-error" class="error-text" role="alert">
                  {{ formErrors.purpose }}
                </p>
                <p id="loan-purpose-hint" class="hint">
                  Tuliskan rencana pemakaian secara singkat agar pemilik mudah menilai (minimal 10 karakter).
                </p>
              </div>

              <label class="checkbox field" [class.is-invalid]="!!formErrors.agree">
                <input
                  type="checkbox"
                  name="agree"
                  [(ngModel)]="form.agree"
                  (ngModelChange)="formErrors.agree = ''; formErrors.summary = ''"
                  [class.is-invalid]="!!formErrors.agree"
                  [attr.aria-invalid]="formErrors.agree ? 'true' : null"
                />
                <span>
                  Saya sudah membaca ketentuan peminjaman dan akan mengembalikan alat sesuai tanggal yang disetujui.
                </span>
              </label>
              <p *ngIf="formErrors.agree" class="error-text" role="alert">
                {{ formErrors.agree }}
              </p>

              <button
                class="btn-primary btn-block form-submit"
                type="submit"
                [disabled]="submitting"
              >
                {{ submitting ? 'Mengirim pengajuan...' : 'Kirim pengajuan' }}
              </button>
            </form>
            <p class="hint cancel-note">Pengajuan bisa dibatalkan selama masih berstatus menunggu.</p>
          </div>

          <!-- Kolom Kanan: Ringkasan Alat -->
          <div *ngIf="selectedItem() as item" class="panel panel-pad" id="loan-summary">
            <img
              class="detail-photo summary-photo"
              [src]="imageSource(item)"
              [alt]="'Foto ' + item.name"
              (error)="handleImageError($event)"
            />
            <h2 class="summary-title">{{ item.name }}</h2>
            <dl class="definition-list summary-meta">
              <div>
                <dt>Kode barang</dt>
                <dd class="mono">{{ item.code }}</dd>
              </div>
              <div>
                <dt>Pemilik</dt>
                <dd>{{ item.owner?.fullName || 'Aset organisasi' }}</dd>
              </div>
              <div>
                <dt>Maksimal pinjam</dt>
                <dd>{{ item.maxDays }} hari</dd>
              </div>
              <div>
                <dt>Lokasi</dt>
                <dd>{{ item.location || 'Tidak dicantumkan' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </ng-template>
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
    .date-grid {
      margin-top: 1rem;
    }
    .date-grid .field {
      margin-top: 0;
    }
    .duration-hint {
      margin-top: 0.5rem;
    }
    .form-error-summary {
      margin-bottom: 1rem;
    }
    .cancel-note {
      margin-top: 0.85rem;
    }
    .summary-photo {
      aspect-ratio: 16 / 9;
      width: 100%;
      object-fit: cover;
      margin-bottom: 0.85rem;
      display: block;
    }
    .summary-title {
      margin: 0;
      font-size: 1.08rem;
      font-weight: 700;
      color: var(--color-ink);
    }
    .summary-meta {
      margin-top: 0.95rem;
    }
  `]
})
export class LoanRequestComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly itemService = inject(ItemService);
  private readonly loanService = inject(LoanService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private subscription = new Subscription();

  @ViewChild('itemSelect') private itemSelect?: CustomSelectComponent;
  @ViewChild('startInput') private startInput?: ElementRef<HTMLInputElement>;
  @ViewChild('endInput') private endInput?: ElementRef<HTMLInputElement>;
  @ViewChild('purposeInput') private purposeInput?: ElementRef<HTMLTextAreaElement>;

  currentUser = this.authService.currentUser;
  activeMembership = this.authService.activeMembership;

  allItems = signal<Item[]>([]);
  myLoans = signal<LoanTransaction[]>([]);
  loading = false;
  submitting = false;
  loadError = '';
  requestedWarning = '';
  private requestedItemId = '';

  todayIso = this.formatDateIso(new Date());

  form = {
    itemId: '',
    start: this.todayIso,
    end: this.todayIso,
    purpose: '',
    agree: false
  };

  formErrors = {
    summary: '',
    item: '',
    start: '',
    end: '',
    purpose: '',
    agree: ''
  };

  isVerifiedMember = computed(() => {
    return this.activeMembership()?.status === 'TERVERIFIKASI';
  });

  eligibleItems = computed(() => {
    const userId = this.currentUser()?.id;
    const pendingItemIds = new Set(
      this.myLoans()
        .filter(loan => loan.status === 'MENUNGGU')
        .map(loan => loan.itemId)
    );

    return this.allItems().filter(item => {
      if (item.status !== 'TERSEDIA') return false;
      if (this.itemService.isLocallyArchived(item.id)) return false;
      if (userId && item.ownerId === userId) return false;
      if (pendingItemIds.has(item.id)) return false;
      return true;
    });
  });

  eligibleItemOptions = computed<ReadonlyArray<SelectOption>>(() =>
    this.eligibleItems().map(item => ({
      value: item.id,
      label: `${item.name} · maks. ${item.maxDays} hari`
    }))
  );

  selectedItem(): Item | null {
    return this.eligibleItems().find(item => item.id === this.form.itemId) || null;
  }

  durationDays(): number | null {
    if (!this.form.start || !this.form.end) return null;
    const diff = this.diffDays(this.form.start, this.form.end);
    if (diff === null || diff < 0) return null;
    return diff + 1;
  }

  ngOnInit(): void {
    this.subscription.add(
      this.route.queryParamMap.subscribe(params => {
        this.requestedItemId = params.get('id') || '';
        this.applyRequestedItemSelection();
      })
    );

    if (this.currentUser() && this.isVerifiedMember()) {
      this.loadData();
    } else {
      this.subscription.add(
        this.authService.currentUser$.subscribe(user => {
          if (user && this.isVerifiedMember() && this.allItems().length === 0 && !this.loading) {
            this.loadData();
          }
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    this.loadError = '';
    this.subscription.add(
      forkJoin({
        itemsRes: this.itemService.getItems(),
        loansRes: this.loanService.getMyLoans()
      }).subscribe({
        next: ({ itemsRes, loansRes }) => {
          this.allItems.set(itemsRes.items || []);
          this.myLoans.set(loansRes.loans || []);
          this.loading = false;
          this.applyRequestedItemSelection();
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.loadError =
            err.error?.message || 'Daftar alat atau pinjaman gagal dimuat dari server.';
        }
      })
    );
  }

  onItemChanged(): void {
    this.clearErrors();
    const item = this.selectedItem();
    if (item) {
      this.applyDefaultDates(item);
    }
  }

  onStartDateChanged(): void {
    this.formErrors.start = '';
    this.formErrors.end = '';
    this.formErrors.summary = '';
    if (this.form.start && this.form.end && this.form.end < this.form.start) {
      this.form.end = this.form.start;
    }
  }

  onSubmit(): void {
    if (this.submitting) return;
    this.clearErrors();

    const user = this.currentUser();
    const item = this.selectedItem();
    if (!user) {
      this.formErrors.summary = 'Sesi anggota tidak ditemukan. Silakan masuk ulang.';
      return;
    }
    if (!item) {
      this.formErrors.item = 'Pilih alat yang tersedia terlebih dahulu.';
    } else if (item.ownerId === user.id) {
      this.formErrors.item = 'Anda tidak bisa meminjam barang milik sendiri.';
    }

    if (!this.form.start) {
      this.formErrors.start = 'Isi tanggal mulai peminjaman.';
    } else if (this.form.start < this.todayIso) {
      this.formErrors.start = 'Tanggal mulai tidak boleh sebelum hari ini.';
    }

    if (!this.form.end) {
      this.formErrors.end = 'Isi tanggal kembali peminjaman.';
    } else if (this.form.start && this.form.end < this.form.start) {
      this.formErrors.end = 'Tanggal kembali harus setelah tanggal mulai.';
    } else if (item && this.form.start) {
      const days = this.diffDays(this.form.start, this.form.end);
      if (days === null || days + 1 > item.maxDays) {
        const selectedSpan = days !== null ? days + 1 : 0;
        this.formErrors.end = `Maksimal peminjaman ${item.maxDays} hari. Rentang yang dipilih ${selectedSpan} hari.`;
      }
    }

    const purpose = this.form.purpose.trim();
    if (purpose.length < 10) {
      this.formErrors.purpose = 'Tuliskan keperluan minimal 10 karakter.';
    }

    if (!this.form.agree) {
      this.formErrors.agree = 'Centang persetujuan ketentuan peminjaman.';
    }

    if (
      this.formErrors.item ||
      this.formErrors.start ||
      this.formErrors.end ||
      this.formErrors.purpose ||
      this.formErrors.agree ||
      !item
    ) {
      focusFirstInvalid(this.hostEl.nativeElement);
      return;
    }

    this.submitting = true;
    this.subscription.add(
      this.loanService
        .requestLoan({
          itemId: item.id,
          expectedReturnDate: this.form.end,
          purpose
        })
        .subscribe({
          next: () => {
            this.submitting = false;
            this.toastService.show(
              'Pengajuan terkirim: Pemilik atau pengurus akan memeriksa permintaan Anda.',
              'success'
            );
            this.router.navigate(['/pinjaman-saya']);
          },
          error: (err: HttpErrorResponse) => {
            this.submitting = false;
            this.formErrors.summary =
              err.error?.message || 'Pengajuan pinjaman tidak dapat dikirim. Periksa kembali isian Anda.';
          }
        })
    );
  }

  imageSource(item: Item): string {
    return normalizeItemImagePath(item.imageUrl || item.image);
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.includes('placeholder-item.svg')) {
      img.src = '/img/placeholder-item.svg';
    }
  }

  private applyRequestedItemSelection(): void {
    const eligible = this.eligibleItems();
    this.requestedWarning = '';

    if (this.requestedItemId) {
      const rawMatch = this.allItems().find(i => i.id === this.requestedItemId);
      const userId = this.currentUser()?.id;
      const hasPending = this.myLoans().some(
        l => l.itemId === this.requestedItemId && l.status === 'MENUNGGU'
      );

      if (rawMatch && userId && rawMatch.ownerId === userId) {
        this.requestedWarning = 'Anda tidak bisa meminjam barang milik sendiri.';
      } else if (rawMatch && hasPending) {
        this.requestedWarning = `Anda sudah punya pengajuan menunggu untuk ${rawMatch.name}.`;
      } else if (rawMatch && (rawMatch.status !== 'TERSEDIA' || this.itemService.isLocallyArchived(rawMatch.id))) {
        this.requestedWarning = `${rawMatch.name} sedang tidak tersedia untuk dipinjam.`;
      }
    }

    const chosen =
      eligible.find(item => item.id === this.requestedItemId) ||
      eligible.find(item => item.id === this.form.itemId) ||
      eligible[0] ||
      null;

    if (chosen) {
      this.form.itemId = chosen.id;
      this.applyDefaultDates(chosen);
    }
  }

  private applyDefaultDates(item: Item): void {
    this.form.start = this.todayIso;
    this.form.end = this.addDaysIso(this.todayIso, Math.max(0, item.maxDays - 1));
  }

  private clearErrors(): void {
    this.formErrors = {
      summary: '',
      item: '',
      start: '',
      end: '',
      purpose: '',
      agree: ''
    };
  }

  private formatDateIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private addDaysIso(baseIso: string, days: number): string {
    const date = new Date(`${baseIso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private diffDays(startIso: string, endIso: string): number | null {
    const start = new Date(`${startIso}T00:00:00Z`);
    const end = new Date(`${endIso}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }
}
