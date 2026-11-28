import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WatermarkedDocumentOutput } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { MembershipService } from '../../core/services/membership.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { CustomSelectComponent, SelectOption } from '../../shared/custom-select/custom-select.component';
import { FormFieldComponent } from '../../shared/form-field/form-field.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { IdWatermarkCanvasComponent } from '../../shared/components/id-watermark-canvas/id-watermark-canvas.component';
import { focusFirstInvalid } from '../../shared/utils/form-focus';

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
    CustomSelectComponent,
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
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  readonly docTypeOptions: ReadonlyArray<SelectOption> = [
    { value: 'KTP', label: 'KTP (Kartu Tanda Penduduk)' },
    { value: 'KTA', label: 'KTA (Kartu Tanda Anggota)' },
    { value: 'SIM / Lainnya', label: 'SIM / Dokumen Resmi Lainnya' }
  ];

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
  fieldErrors = {
    inviteCode: '',
    fullName: '',
    waNumber: '',
    password: '',
    documentUrl: ''
  };

  onInviteCodeChanged(): void {
    this.fieldErrors.inviteCode = '';
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
    this.fieldErrors.inviteCode = '';
    if (code.length < 3) {
      this.stepTwoUnlocked = false;
      this.fieldErrors.inviteCode = 'Masukkan kode undangan resmi (minimal 3 karakter).';
      this.inviteStatus = {
        kind: 'warn',
        title: 'Kode terlalu pendek',
        message: 'Masukkan kode undangan resmi dari pengurus (minimal 3 karakter).'
      };
      focusFirstInvalid(this.hostEl.nativeElement);
      return;
    }

    this.validatingCode = true;
    this.errorMessage = '';

    this.authService.checkInviteCode(code).subscribe({
      next: res => {
        this.validatingCode = false;
        if (res.success && res.organization) {
          this.stepTwoUnlocked = true;
          this.fieldErrors.inviteCode = '';
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
          this.fieldErrors.inviteCode = res.message || 'Kode undangan tidak valid.';
          this.inviteStatus = {
            kind: 'warn',
            title: 'Kode Tidak Valid',
            message: res.message || 'Kode undangan tidak ditemukan atau organisasi belum aktif.'
          };
          focusFirstInvalid(this.hostEl.nativeElement);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.validatingCode = false;
        this.stepTwoUnlocked = false;
        const msg = err.error?.message || 'Kode undangan tidak valid atau organisasi tidak aktif.';
        this.fieldErrors.inviteCode = msg;
        this.inviteStatus = {
          kind: 'warn',
          title: 'Validasi Gagal',
          message: msg
        };
        focusFirstInvalid(this.hostEl.nativeElement);
      }
    });
  }

  onDocumentProcessed(doc: WatermarkedDocumentOutput): void {
    this.preparedDocument = doc;
    this.form.documentType = doc.documentType;
    this.form.documentName = doc.fileName;
    this.form.documentUrl = doc.dataUrl;
    this.fieldErrors.documentUrl = '';
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

    this.fieldErrors = {
      inviteCode: inviteCode ? '' : 'Kode undangan wajib diisi.',
      fullName: fullName ? '' : 'Nama lengkap wajib diisi.',
      waNumber: waNumber ? '' : 'Nomor WhatsApp wajib diisi.',
      password: this.form.password.length >= 6 ? '' : 'Kata sandi minimal 6 karakter.',
      documentUrl: this.form.documentUrl ? '' : 'Harap unggah foto identitas (KTP/KTA) untuk verifikasi pengurus.'
    };

    if (
      this.fieldErrors.inviteCode ||
      this.fieldErrors.fullName ||
      this.fieldErrors.waNumber ||
      this.fieldErrors.password ||
      this.fieldErrors.documentUrl
    ) {
      this.errorMessage = 'Lengkapi seluruh field wajib yang ditandai merah sebelum mengirim.';
      focusFirstInvalid(this.hostEl.nativeElement);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const docFile = this.preparedDocument?.file;

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
        documentFile: docFile,
        documentUrl: docFile ? undefined : this.form.documentUrl
      })
      .subscribe({
        next: response => {
          const persistedUrl = response.user.memberships?.[0]?.documentUrl || this.form.documentUrl;
          this.membershipService.saveDocumentPreview(`wa:${waNumber}`, {
            documentType: this.form.documentType,
            documentName: this.form.documentName,
            documentUrl: persistedUrl,
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
