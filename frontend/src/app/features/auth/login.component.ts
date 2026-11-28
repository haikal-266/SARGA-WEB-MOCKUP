import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { focusFirstInvalid } from '../../shared/utils/form-focus';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertComponent],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="brand-badge">SARGA</div>
        <h1 class="auth-title">Masuk ke akun SARGA</h1>
        <p class="auth-subtitle">Gunakan nomor WhatsApp yang tercatat pada data anggota organisasi.</p>

        <form (ngSubmit)="onSubmit()" class="auth-form" novalidate>
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
              (ngModelChange)="fieldErrors.waNumber = ''; errorMessage = ''"
              name="waNumber"
              required
              placeholder="Contoh: 081234567890"
              class="form-input"
              [class.is-invalid]="!!fieldErrors.waNumber"
              [attr.aria-invalid]="fieldErrors.waNumber ? 'true' : null"
            />
            <p *ngIf="fieldErrors.waNumber" class="error-text" role="alert">{{ fieldErrors.waNumber }}</p>
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
              (ngModelChange)="fieldErrors.password = ''; errorMessage = ''"
              name="password"
              required
              placeholder="••••••••"
              class="form-input"
              [class.is-invalid]="!!fieldErrors.password"
              [attr.aria-invalid]="fieldErrors.password ? 'true' : null"
            />
            <p *ngIf="fieldErrors.password" class="error-text" role="alert">{{ fieldErrors.password }}</p>
          </div>

          <button type="submit" [disabled]="loading" class="btn-primary btn-block">
            {{ loading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>

        <p class="auth-nav-note">
          Belum punya akun?
          <a routerLink="/auth/register" class="link">Daftar dengan kode undangan pengurus</a>.
          <span class="note-break">
            Sudah mendaftar? <a routerLink="/status-akun" class="link">Lihat status akun</a>.
          </span>
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
  `,
  styles: [`
    .auth-wrapper {
      min-height: calc(100dvh - 180px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 0.25rem;
    }
    .auth-card {
      background: #ffffff;
      border: 1px solid var(--color-rule);
      border-radius: var(--radius-card);
      padding: 1.5rem 1.25rem;
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-subtle);
    }
    @media (min-width: 480px) {
      .auth-card {
        padding: 2rem 1.75rem;
      }
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
      font-size: clamp(1.35rem, 4vw, 1.55rem);
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
      margin-bottom: 1.15rem;
    }
    .label-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .forgot-link {
      background: none;
      border: 0;
      padding: 0.5rem 0;
      min-height: 44px;
      color: var(--color-accent-soft-ink);
      font-size: 0.84rem;
      font-weight: 600;
      text-decoration: underline;
    }
    .auth-form app-alert {
      display: block;
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.88rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
      color: var(--color-ink-2);
    }
    .auth-nav-note {
      margin: 1.15rem 0 0;
      font-size: 0.84rem;
      color: var(--color-muted);
      text-align: center;
      line-height: 1.55;
    }
    .note-break {
      display: block;
      margin-top: 0.25rem;
    }
    .auth-nav-note .link {
      color: var(--color-accent-soft-ink);
      font-weight: 600;
      text-decoration: underline;
    }
  `]
})
export class LoginComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private hostEl = inject(ElementRef<HTMLElement>);
  private returnFocusEl: HTMLElement | null = null;

  waNumber = '';
  password = '';
  loading = false;
  errorMessage = '';
  fieldErrors = { waNumber: '', password: '' };
  forgotModalOpen = false;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.forgotModalOpen) {
      this.closeForgotModal();
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
  }

  onSubmit(): void {
    this.fieldErrors = {
      waNumber: this.waNumber.trim() ? '' : 'Nomor WhatsApp wajib diisi.',
      password: this.password ? '' : 'Kata sandi wajib diisi.'
    };
    if (this.fieldErrors.waNumber || this.fieldErrors.password) {
      this.errorMessage = 'Nomor WhatsApp dan kata sandi wajib diisi.';
      focusFirstInvalid(this.hostEl.nativeElement);
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
    document.body.classList.add('modal-open');
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeForgotModal();
    }
  }

  closeForgotModal(): void {
    this.forgotModalOpen = false;
    document.body.classList.remove('modal-open');
    const el = this.returnFocusEl;
    this.returnFocusEl = null;
    if (el) setTimeout(() => el.focus());
  }
}
