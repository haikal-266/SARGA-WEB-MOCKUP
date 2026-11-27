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
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface OtpSubmitPayload {
  waNumber: string;
  code: string;
}

@Component({
  selector: 'app-otp-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="open"
      class="modal-backdrop"
      (click)="onBackdropClick($event)"
    >
      <div
        #dialogEl
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-modal-title"
        (keydown)="onDialogKeydown($event)"
      >
        <div class="modal-head">
          <h2 id="otp-modal-title">Masuk dengan kode OTP</h2>
          <button
            class="modal-close"
            type="button"
            (click)="close()"
            aria-label="Tutup dialog"
          >
            ×
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" novalidate>
          <div class="modal-body">
            <div class="alert alert-info otp-info-box">
              <strong>Verifikasi WhatsApp</strong>
              <p>Masukkan 6 digit kode OTP resmi yang dikirimkan ke nomor WhatsApp terdaftar.</p>
            </div>

            <div
              *ngIf="serverMessage"
              class="alert otp-server-box"
              [ngClass]="{
                'alert-info': serverMessageKind === 'info',
                'alert-warn': serverMessageKind === 'warning',
                'alert-danger': serverMessageKind === 'error'
              }"
              [attr.role]="serverMessageKind === 'error' ? 'alert' : 'status'"
              aria-live="polite"
            >
              <strong>{{ serverMessageTitle }}</strong>
              <p>{{ serverMessage }}</p>
            </div>

            <div class="field">
              <label class="label" for="otp-wa">Nomor WhatsApp</label>
              <input
                #waInput
                class="form-input"
                id="otp-wa"
                name="wa"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                placeholder="Contoh: 081298765432"
                [(ngModel)]="waNumber"
                (ngModelChange)="waError = ''"
                [attr.aria-invalid]="waError ? 'true' : null"
                [attr.aria-describedby]="waError ? 'otp-wa-error' : null"
                required
              />
              <p *ngIf="waError" id="otp-wa-error" class="error-text" role="alert">
                {{ waError }}
              </p>
            </div>

            <div class="field">
              <label class="label" for="otp-code">Kode 6 angka</label>
              <input
                #codeInput
                class="form-input mono otp-code-input"
                id="otp-code"
                name="code"
                type="text"
                inputmode="numeric"
                maxlength="6"
                autocomplete="one-time-code"
                pattern="[0-9]{6}"
                placeholder="000000"
                [(ngModel)]="code"
                (input)="onCodeInput($event)"
                [attr.aria-invalid]="codeError ? 'true' : null"
                [attr.aria-describedby]="codeError ? 'otp-code-error otp-code-hint' : 'otp-code-hint'"
                required
              />
              <p *ngIf="codeError" id="otp-code-error" class="error-text" role="alert">
                {{ codeError }}
              </p>
              <p id="otp-code-hint" class="hint">Kode berlaku 5 menit pada sistem nyata.</p>
            </div>
          </div>

          <div class="modal-actions">
            <button
              class="btn-secondary"
              type="button"
              (click)="close()"
              [disabled]="submitting"
            >
              Batal
            </button>
            <button
              class="btn-primary"
              type="submit"
              [disabled]="submitting"
            >
              {{ submitting ? 'Memproses...' : 'Masuk' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .otp-info-box,
    .otp-server-box {
      margin-bottom: 1rem;
    }
    .otp-code-input {
      letter-spacing: 0.25em;
      font-size: 1.05rem;
    }
  `]
})
export class OtpModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() initialWa = '';
  @Input() submitting = false;
  @Input() serverMessage = '';
  @Input() serverMessageKind: 'info' | 'warning' | 'error' = 'info';

  @Output() closed = new EventEmitter<void>();
  @Output() otpSubmit = new EventEmitter<OtpSubmitPayload>();

  @ViewChild('dialogEl') private dialogEl?: ElementRef<HTMLElement>;
  @ViewChild('waInput') private waInput?: ElementRef<HTMLInputElement>;
  @ViewChild('codeInput') private codeInput?: ElementRef<HTMLInputElement>;

  waNumber = '';
  code = '';
  waError = '';
  codeError = '';

  private lastFocused: HTMLElement | null = null;

  get serverMessageTitle(): string {
    if (this.serverMessageKind === 'error') return 'Verifikasi gagal';
    if (this.serverMessageKind === 'warning') return 'Pemberitahuan';
    return 'Informasi OTP';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.onOpened();
      } else {
        this.restoreScrollAndFocus();
      }
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.open && !this.submitting) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.submitting) {
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

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 6);
    this.code = digitsOnly;
    input.value = digitsOnly;
    this.codeError = '';
  }

  onSubmit(): void {
    if (this.submitting) return;
    this.waError = '';
    this.codeError = '';

    const normalizedWa = this.waNumber.replace(/\D/g, '');
    if (normalizedWa.length < 9) {
      this.waError = 'Nomor WhatsApp belum lengkap.';
      this.waInput?.nativeElement.focus();
      return;
    }

    const trimmedCode = this.code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      this.codeError = 'Masukkan kode 6 angka.';
      this.codeInput?.nativeElement.focus();
      return;
    }

    this.otpSubmit.emit({
      waNumber: this.waNumber.trim(),
      code: trimmedCode
    });
  }

  close(): void {
    this.restoreScrollAndFocus();
    this.closed.emit();
  }

  private onOpened(): void {
    this.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.waNumber = this.initialWa || '081298765432';
    this.code = '';
    this.waError = '';
    this.codeError = '';
    document.body.classList.add('modal-open');

    setTimeout(() => {
      const normalized = this.waNumber.replace(/\D/g, '');
      if (normalized.length >= 9 && this.codeInput) {
        this.codeInput.nativeElement.focus();
      } else {
        this.waInput?.nativeElement.focus();
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
