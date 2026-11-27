import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WatermarkedDocumentOutput } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { MembershipService } from '../../core/services/membership.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { FormFieldComponent } from '../../shared/form-field/form-field.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { IdWatermarkCanvasComponent } from '../../shared/components/id-watermark-canvas/id-watermark-canvas.component';

interface InviteStatus {
  kind: 'ok' | 'info' | 'warn';
  title: string;
  message: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AlertComponent,
    FormFieldComponent,
    IconComponent,
    IdWatermarkCanvasComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly membershipService = inject(MembershipService);

  form = {
    inviteCode: '',
    fullName: '',
    waNumber: '',
    address: '',
    password: '',
    documentType: 'KTP',
    documentUrl: '',
    documentName: '',
    documentNote: ''
  };

  validatingCode = false;
  stepTwoUnlocked = false;
  resolvedOrgName = '';
  picName = '';
  picContact = '';
  picPosition = '';
  orgType = '';
  orgAddress = '';

  inviteStatus: InviteStatus | null = null;
  preparedDocument: WatermarkedDocumentOutput | null = null;

  loading = false;
  errorMessage = '';
  successMessage = '';

  onInviteCodeChanged(): void {
    const code = this.form.inviteCode.trim().toUpperCase();
    if (this.stepTwoUnlocked && code !== this.form.inviteCode.trim().toUpperCase()) {
      this.stepTwoUnlocked = false;
      this.resolvedOrgName = '';
      this.picName = '';
      this.picContact = '';
      this.picPosition = '';
    }

    if (code.length >= 3) {
      this.inviteStatus = {
        kind: 'info',
        title: `Kode: ${code}`,
        message: 'Klik "Validasi Kode" untuk memverifikasi organisasi & penanggung jawab resmi.'
      };
    } else {
      this.inviteStatus = null;
      this.stepTwoUnlocked = false;
    }
  }

  unlockWithCustomCode(): void {
    const code = this.form.inviteCode.trim().toUpperCase();
    if (code.length < 3) {
      this.stepTwoUnlocked = false;
      this.inviteStatus = {
        kind: 'warn',
        title: 'Kode terlalu pendek',
        message: 'Masukkan kode undangan resmi dari pengurus (minimal 3 karakter).'
      };
      return;
    }

    this.validatingCode = true;
    this.errorMessage = '';

    this.authService.checkInviteCode(code).subscribe({
      next: res => {
        this.validatingCode = false;
        if (res.success && res.organization) {
          this.stepTwoUnlocked = true;
          this.resolvedOrgName = res.organization.name;
          this.orgType = res.organization.type || 'Organisasi';
          this.orgAddress = res.organization.address || '';
          this.picName = res.pic?.name || 'Pengurus Organisasi';
          this.picContact = res.pic?.contact || res.organization.contact || 'Kontak Resmi';
          this.picPosition = res.pic?.position || 'Ketua / Pengurus Utama';

          this.inviteStatus = {
            kind: 'ok',
            title: `Organisasi Terverifikasi: ${this.resolvedOrgName}`,
            message: `Penanggung jawab resmi: ${this.picName} (${this.picPosition}). Formulir Langkah 2 telah dibuka.`
          };
        } else {
          this.stepTwoUnlocked = false;
          this.inviteStatus = {
            kind: 'warn',
            title: 'Kode Tidak Valid',
            message: res.message || 'Kode undangan tidak ditemukan atau organisasi belum aktif.'
          };
        }
      },
      error: (err: HttpErrorResponse) => {
        this.validatingCode = false;
        this.stepTwoUnlocked = false;
        this.inviteStatus = {
          kind: 'warn',
          title: 'Validasi Gagal',
          message: err.error?.message || 'Kode undangan tidak valid atau organisasi tidak aktif.'
        };
      }
    });
  }

  onDocumentProcessed(doc: WatermarkedDocumentOutput): void {
    this.preparedDocument = doc;
    this.form.documentType = doc.documentType;
    this.form.documentName = doc.fileName;
    this.form.documentUrl = doc.dataUrl;
  }

  onDocumentCleared(): void {
    this.preparedDocument = null;
    this.form.documentUrl = '';
    this.form.documentName = '';
  }

  onSubmit(): void {
    if (this.loading || !this.stepTwoUnlocked) return;

    const fullName = this.form.fullName.trim();
    const waNumber = this.form.waNumber.trim();
    const inviteCode = this.form.inviteCode.trim().toUpperCase();

    if (!fullName || !waNumber || !inviteCode) {
      this.errorMessage = 'Nama, nomor WhatsApp, dan kode undangan wajib diisi.';
      return;
    }
    if (this.form.password.length < 6) {
      this.errorMessage = 'Kata sandi minimal 6 karakter.';
      return;
    }
    if (!this.form.documentUrl) {
      this.errorMessage = 'Harap unggah foto identitas (KTP/KTA) untuk verifikasi pengurus.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const safeDocumentUrl =
      this.form.documentUrl.startsWith('data:') && this.form.documentUrl.length > 65000
        ? undefined
        : this.form.documentUrl;

    this.authService
      .register({
        fullName,
        waNumber,
        password: this.form.password,
        address: this.form.address.trim(),
        inviteCode,
        documentType: this.form.documentType,
        documentName: this.form.documentName,
        documentNote: this.form.documentNote.trim() || undefined,
        documentUrl: safeDocumentUrl
      })
      .subscribe({
        next: response => {
          this.membershipService.saveDocumentPreview(`wa:${waNumber}`, {
            documentType: this.form.documentType,
            documentName: this.form.documentName,
            documentUrl: this.form.documentUrl,
            documentNote: this.form.documentNote.trim() || undefined,
            watermarkSummary: this.preparedDocument?.watermarkSummary,
            fingerprint: this.preparedDocument?.fingerprint,
            savedAt: new Date().toISOString()
          });

          this.loading = false;
          this.successMessage = response.message;
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage =
            error.error?.message || 'Pendaftaran tidak berhasil. Periksa data dan kode undangan.';
        }
      });
  }
}
