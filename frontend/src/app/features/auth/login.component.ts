import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { OtpModalComponent, OtpSubmitPayload } from '../../shared/otp-modal/otp-modal.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertComponent, OtpModalComponent],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="brand-badge">SARGA</div>
        <h1 class="auth-title">Masuk ke akun SARGA</h1>
        <p class="auth-subtitle">Gunakan nomor WhatsApp yang tercatat pada data anggota organisasi.</p>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <app-alert
            *ngIf="errorMessage"
            kind="error"
            title="Gagal masuk"
            [message]="errorMessage"
          ></app-alert>

          <div class="form-group">
            <label for="waNumber">Nomor WhatsApp terdaftar</label>
            <input
              id="waNumber"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              [(ngModel)]="waNumber"
              name="waNumber"
              required
              placeholder="Contoh: 081234567890"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="password" style="margin-bottom:0">Kata sandi</label>
              <button
                type="button"
                class="forgot-link"
                (click)="openForgotModal($event)"
              >
                Lupa kata sandi?
              </button>
            </div>
            <input
              id="password"
              type="password"
              autocomplete="current-password"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="••••••••"
              class="form-control"
            />
          </div>

          <button type="submit" [disabled]="loading" class="btn btn-primary btn-block">
            {{ loading ? 'Memproses...' : 'Masuk' }}
          </button>
          <button
            type="button"
            (click)="openOtpModal()"
            class="btn btn-secondary btn-block otp-trigger"
          >
            Masuk dengan kode OTP
          </button>
        </form>

        <p class="auth-nav-note">
          Belum punya akun?
          <a routerLink="/auth/register" class="link">Daftar dengan kode undangan pengurus</a>.
          Sudah mendaftar?
          <a routerLink="/status-akun" class="link">Lihat status akun</a>.
        </p>
      </div>
    </div>

    <div *ngIf="forgotModalOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="forgot-pw-title">
        <div class="modal-head">
          <h2 id="forgot-pw-title">Lupa kata sandi</h2>
          <button
            type="button"
            class="modal-close"
            aria-label="Tutup dialog"
            (click)="closeForgotModal()"
          >
            ✕
          </button>
        </div>
        <div class="modal-body">
          <p class="small">
            Untuk menjaga keamanan akun komunitas, silakan hubungi pengurus organisasi Anda guna memverifikasi identitas dan melakukan pengaturan ulang kata sandi.
          </p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" (click)="closeForgotModal()">Tutup</button>
        </div>
      </div>
    </div>

    <app-otp-modal
      [open]="otpModalOpen"
      [initialWa]="waNumber || '081298765432'"
      [serverMessage]="otpServerMessage"
      [serverMessageKind]="otpServerKind"
      (closed)="closeOtpModal()"
      (otpSubmit)="onOtpSubmit($event)"
    />
  `,
  styles: [`
    .auth-wrapper {
      min-height: calc(100vh - 180px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .auth-card {
      background: #ffffff;
      border: 1px solid var(--color-rule);
      border-radius: var(--radius-card);
      padding: 2rem 1.75rem;
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-subtle);
    }
    .brand-badge {
      display: inline-block;
      font-weight: 700;
      font-size: 0.85rem;
      letter-spacing: 0.1em;
      color: var(--color-accent-soft-ink);
      background: var(--color-accent-soft);
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-pill);
      margin-bottom: 1rem;
    }
    .auth-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-ink);
      margin: 0 0 0.25rem 0;
    }
    .auth-subtitle {
      font-size: 0.88rem;
      color: var(--color-muted);
      margin: 0 0 1.5rem 0;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .label-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.35rem;
    }
    .forgot-link {
      background: none;
      border: 0;
      padding: 0.35rem 0;
      min-height: 36px;
      color: var(--color-accent-soft-ink);
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: underline;
    }
    .auth-form app-alert {
      display: block;
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
      color: var(--color-ink-2);
    }
    .form-control {
      width: 100%;
      min-height: 44px;
      padding: 0.7rem 0.9rem;
      border: 1px solid var(--color-muted-light);
      border-radius: var(--radius-input);
      font-size: 0.95rem;
    }
    .form-control:focus-visible,
    .forgot-link:focus-visible,
    .hint-account:focus-visible {
      outline: 3px solid var(--color-focus);
      outline-offset: 2px;
    }
    .register-hint {
      margin: 1rem 0 0;
      color: var(--color-muted);
      font-size: 0.84rem;
    }
    .otp-trigger {
      margin-top: 0.55rem;
    }
    .auth-nav-note {
      margin-top: 1rem;
      font-size: 0.82rem;
      color: var(--color-muted);
      text-align: center;
    }
    .auth-nav-note .link {
      color: var(--color-accent);
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private returnFocusEl: HTMLElement | null = null;

  waNumber = '';
  password = '';
  loading = false;
  errorMessage = '';
  forgotModalOpen = false;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.forgotModalOpen) {
      this.closeForgotModal();
    }
  }

  otpModalOpen = false;
  otpServerMessage = '';
  otpServerKind: 'info' | 'warning' | 'error' = 'info';

  onSubmit(): void {
    if (!this.waNumber || !this.password) {
      this.errorMessage = 'Nomor WhatsApp dan kata sandi wajib diisi.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ waNumber: this.waNumber, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || err.error?.error || 'Gagal masuk. Periksa nomor WhatsApp dan kata sandi.';
      }
    });
  }

  openForgotModal(event: Event): void {
    this.returnFocusEl = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    this.forgotModalOpen = true;
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeForgotModal();
    }
  }

  closeForgotModal(): void {
    this.forgotModalOpen = false;
    const el = this.returnFocusEl;
    this.returnFocusEl = null;
    if (el) setTimeout(() => el.focus());
  }

  openOtpModal(): void {
    this.otpServerMessage = '';
    this.otpServerKind = 'info';
    this.otpModalOpen = true;
  }

  closeOtpModal(): void {
    this.otpModalOpen = false;
    this.otpServerMessage = '';
  }

  onOtpSubmit(payload: OtpSubmitPayload): void {
    this.waNumber = payload.waNumber;
    this.otpServerKind = 'warning';
    this.otpServerMessage =
      'Layanan OTP WhatsApp di server segera hadir (API belum tersedia). Silakan gunakan kata sandi pada formulir Masuk.';
    this.toastService.show(
      'Layanan OTP WhatsApp segera hadir. Gunakan kata sandi untuk masuk.',
      'info'
    );
  }
}
