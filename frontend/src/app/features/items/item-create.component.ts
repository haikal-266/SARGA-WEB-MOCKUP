import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Item } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ITEM_IMAGE_OPTIONS, ItemService } from '../../core/services/item.service';
import { MembershipService } from '../../core/services/membership.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { CustomSelectComponent, SelectOption } from '../../shared/custom-select/custom-select.component';
import { FilePickerComponent } from '../../shared/file-picker/file-picker.component';
import { focusFirstInvalid } from '../../shared/utils/form-focus';

interface ItemCreateForm {
  name: string;
  description: string;
  location: string;
  maxDays: number | null;
  contents: string;
  instructions: string;
  imagePreset: string;
  isSafeAndReady: boolean;
}

@Component({
  selector: 'app-item-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertComponent, CustomSelectComponent, FilePickerComponent],
  template: `
    <div class="page page-mid">
      <div class="page-head split">
        <div>
          <p class="kicker">Pemilik</p>
          <h1>Daftar barang baru</h1>
          <p class="lede">Barang yang disimpan akan langsung tayang di katalog organisasi aktif dengan kode otomatis.</p>
        </div>
        <div class="head-actions">
          <a class="btn-secondary" routerLink="/katalog">Kembali ke katalog</a>
        </div>
      </div>

      <app-alert
        *ngIf="!canCreateItems"
        kind="warning"
        title="Keanggotaan terverifikasi diperlukan"
        [message]="membershipMessage"
      />
      <app-alert
        *ngIf="errorMessage"
        kind="error"
        title="Barang gagal disimpan"
        [message]="errorMessage"
        style="display:block;margin-bottom:1rem"
      />
      <app-alert
        *ngIf="successMessage"
        kind="success"
        title="Barang berhasil disimpan"
        [message]="successMessage"
        style="display:block;margin-bottom:1rem"
      />

      <p *ngIf="saving" class="small" role="status" aria-live="polite" style="margin-bottom:1rem">
        Menyimpan barang ke katalog...
      </p>

      <div class="panel panel-pad" *ngIf="canCreateItems && !createdItem">
        <form (ngSubmit)="onSubmit()" [attr.aria-busy]="saving" novalidate>
          <div class="field">
            <label class="label" for="item-name">Nama barang</label>
            <input
              id="item-name"
              name="name"
              type="text"
              class="form-input"
              placeholder='Contoh: "Bor listrik impact 13 mm"'
              required
              [class.is-invalid]="!!fieldErrors.name"
              [attr.aria-invalid]="fieldErrors.name ? 'true' : null"
              [(ngModel)]="form.name"
              (ngModelChange)="fieldErrors.name = ''; errorMessage = ''"
            />
            <p *ngIf="fieldErrors.name" class="error-text" role="alert">{{ fieldErrors.name }}</p>
          </div>

          <div class="form-grid two">
            <div class="field">
              <label class="label" for="item-max-days">Maksimal masa pinjam (1–14 hari)</label>
              <input
                id="item-max-days"
                name="maxDays"
                type="number"
                class="form-input"
                min="1"
                max="14"
                step="1"
                inputmode="numeric"
                required
                [class.is-invalid]="!!fieldErrors.maxDays"
                [attr.aria-invalid]="fieldErrors.maxDays ? 'true' : null"
                [(ngModel)]="form.maxDays"
                (ngModelChange)="fieldErrors.maxDays = ''; errorMessage = ''"
              />
              <p *ngIf="fieldErrors.maxDays" class="error-text" role="alert">{{ fieldErrors.maxDays }}</p>
            </div>

            <div class="field">
              <label class="label" for="item-location">Lokasi penyimpanan atau pengambilan</label>
              <input
                id="item-location"
                name="location"
                type="text"
                class="form-input"
                required
                [class.is-invalid]="!!fieldErrors.location"
                [attr.aria-invalid]="fieldErrors.location ? 'true' : null"
                [(ngModel)]="form.location"
                (ngModelChange)="fieldErrors.location = ''; errorMessage = ''"
              />
              <p *ngIf="fieldErrors.location" class="error-text" role="alert">{{ fieldErrors.location }}</p>
            </div>
          </div>

          <div class="field">
            <label class="label" for="item-description">Deskripsi singkat</label>
            <textarea
              id="item-description"
              name="description"
              class="form-input"
              rows="3"
              required
              [class.is-invalid]="!!fieldErrors.description"
              [attr.aria-invalid]="fieldErrors.description ? 'true' : null"
              [(ngModel)]="form.description"
              (ngModelChange)="fieldErrors.description = ''; errorMessage = ''"
            ></textarea>
            <p *ngIf="fieldErrors.description" class="error-text" role="alert">{{ fieldErrors.description }}</p>
          </div>

          <div class="field">
            <label class="label" for="item-contents">Kelengkapan barang (opsional, satu per baris)</label>
            <textarea
              id="item-contents"
              name="contents"
              class="form-input"
              rows="3"
              placeholder='Contoh: "1 kabel pengisi daya"'
              [(ngModel)]="form.contents"
            ></textarea>
          </div>

          <div class="field">
            <label class="label" for="item-instructions">Catatan kondisi &amp; petunjuk penggunaan (maks. 250 karakter)</label>
            <textarea
              id="item-instructions"
              name="instructions"
              class="form-input"
              rows="3"
              maxlength="250"
              required
              [class.is-invalid]="!!fieldErrors.instructions"
              [attr.aria-invalid]="fieldErrors.instructions ? 'true' : null"
              [(ngModel)]="form.instructions"
              (ngModelChange)="fieldErrors.instructions = ''; errorMessage = ''"
            ></textarea>
            <p *ngIf="fieldErrors.instructions" class="error-text" role="alert">{{ fieldErrors.instructions }}</p>
            <p class="hint">{{ form.instructions.length }}/250 karakter</p>
          </div>

          <div class="form-grid two">
            <div class="field">
              <label class="label" for="item-image-file">Unggah foto barang (JPG/PNG, maks. 5 MB)</label>
              <app-file-picker
                id="item-image-file"
                placeholder="Belum ada foto dipilih"
                [fileName]="selectedFile?.name || ''"
                (fileSelected)="onFilePicked($event)"
              />
            </div>

            <div class="field">
              <label class="label" for="item-image-preset">Atau pilih foto contoh</label>
              <app-select
                id="item-image-preset"
                name="imagePreset"
                [options]="imageSelectOptions"
                [(ngModel)]="form.imagePreset"
              />
            </div>
          </div>

          <label class="safety-check" [class.is-invalid]="!!fieldErrors.isSafeAndReady">
            <input
              name="isSafeAndReady"
              type="checkbox"
              required
              [class.is-invalid]="!!fieldErrors.isSafeAndReady"
              [attr.aria-invalid]="fieldErrors.isSafeAndReady ? 'true' : null"
              [(ngModel)]="form.isSafeAndReady"
              (ngModelChange)="fieldErrors.isSafeAndReady = ''; errorMessage = ''"
            />
            <span>Saya menyatakan barang aman dan layak digunakan.</span>
          </label>
          <p *ngIf="fieldErrors.isSafeAndReady" class="error-text" role="alert">{{ fieldErrors.isSafeAndReady }}</p>

          <button type="submit" class="btn-primary btn-block form-submit" [disabled]="saving">
            {{ saving ? 'Menyimpan barang...' : 'Simpan ke katalog' }}
          </button>
        </form>
      </div>

      <div *ngIf="createdItem" class="btn-row" style="margin-top:.75rem">
        <a class="btn-primary" [routerLink]="['/katalog', createdItem.id]">Lihat barang di katalog</a>
        <button type="button" class="btn-secondary" (click)="resetForm()">Daftarkan barang lagi</button>
      </div>
    </div>
  `,
  styles: [`
    .safety-check {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-height: 44px;
      margin-top: 1rem;
      color: var(--color-ink);
      cursor: pointer;
    }
  `]
})
export class ItemCreateComponent {
  private readonly authService = inject(AuthService);
  private readonly itemService = inject(ItemService);
  private readonly membershipService = inject(MembershipService);
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  readonly imageSelectOptions: ReadonlyArray<SelectOption> = ITEM_IMAGE_OPTIONS.map(([value, label]) => ({
    value,
    label
  }));

  form: ItemCreateForm = {
    name: '',
    description: '',
    location: '',
    maxDays: 3,
    contents: '',
    instructions: '',
    imagePreset: '/img/placeholder-item.svg',
    isSafeAndReady: false
  };
  selectedFile: File | null = null;
  saving = false;
  errorMessage = '';
  successMessage = '';
  createdItem: Item | null = null;
  fieldErrors = {
    name: '',
    maxDays: '',
    location: '',
    description: '',
    instructions: '',
    isSafeAndReady: ''
  };

  get canCreateItems(): boolean {
    return this.authService.activeMembership()?.status === 'TERVERIFIKASI';
  }

  get membershipMessage(): string {
    const membership = this.authService.activeMembership();
    if (!membership) return 'Pilih organisasi tempat Anda menjadi anggota terverifikasi melalui menu organisasi.';
    if (membership.status === 'MENUNGGU_VERIFIKASI') return 'Keanggotaan Anda masih menunggu verifikasi pengurus.';
    if (membership.status === 'DITOLAK') return 'Keanggotaan Anda ditolak. Hubungi pengurus organisasi untuk informasi lebih lanjut.';
    return 'Pilih organisasi aktif yang keanggotaannya sudah terverifikasi.';
  }

  onFilePicked(file: File): void {
    this.selectedFile = null;
    const validMime = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!validMime) {
      this.errorMessage = 'Format foto harus JPG, PNG, atau WebP.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Ukuran foto maksimal 5 MB.';
      return;
    }
    this.errorMessage = '';
    this.selectedFile = file;
  }

  onSubmit(): void {
    if (this.saving) return;

    const membership = this.authService.activeMembership();
    if (!membership || membership.status !== 'TERVERIFIKASI') {
      this.errorMessage = 'Keanggotaan terverifikasi diperlukan untuk mendaftarkan barang.';
      return;
    }

    const maxDays = Number(this.form.maxDays);
    const name = this.form.name.trim();
    const description = this.form.description.trim();
    const location = this.form.location.trim();
    const instructions = this.form.instructions.trim();

    this.fieldErrors = {
      name: name ? '' : 'Nama barang wajib diisi.',
      maxDays: Number.isInteger(maxDays) && maxDays >= 1 && maxDays <= 14 ? '' : 'Isi bilangan bulat antara 1 sampai 14 hari.',
      location: location ? '' : 'Lokasi pengambilan wajib diisi.',
      description: description ? '' : 'Deskripsi singkat wajib diisi.',
      instructions:
        !instructions
          ? 'Catatan kondisi & petunjuk penggunaan wajib diisi.'
          : instructions.length > 250
            ? 'Maksimal 250 karakter.'
            : '',
      isSafeAndReady: this.form.isSafeAndReady ? '' : 'Centang pernyataan barang aman digunakan.'
    };

    if (
      this.fieldErrors.name ||
      this.fieldErrors.maxDays ||
      this.fieldErrors.location ||
      this.fieldErrors.description ||
      this.fieldErrors.instructions ||
      this.fieldErrors.isSafeAndReady
    ) {
      this.errorMessage = 'Lengkapi seluruh field wajib yang ditandai merah sebelum menyimpan barang.';
      focusFirstInvalid(this.hostEl.nativeElement);
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    if (this.selectedFile) {
      this.membershipService.uploadForensicDocument(this.selectedFile, this.selectedFile.name).subscribe({
        next: uploadRes => this.submitItemPayload(membership.orgId, uploadRes.image.url),
        error: () => this.submitItemPayload(membership.orgId, this.form.imagePreset)
      });
    } else {
      this.submitItemPayload(membership.orgId, this.form.imagePreset);
    }
  }

  resetForm(): void {
    this.createdItem = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.selectedFile = null;
    this.form = {
      name: '',
      description: '',
      location: '',
      maxDays: 3,
      contents: '',
      instructions: '',
      imagePreset: '/img/placeholder-item.svg',
      isSafeAndReady: false
    };
  }

  private submitItemPayload(orgId: string, imagePath: string): void {
    const itemData: Partial<Item> = {
      orgId,
      name: this.form.name.trim(),
      description: this.form.description.trim(),
      location: this.form.location.trim(),
      maxDays: Number(this.form.maxDays),
      contents: this.form.contents.split(/\r?\n/).map(entry => entry.trim()).filter(Boolean),
      instructions: this.form.instructions.trim(),
      image: imagePath,
      isSafeAndReady: this.form.isSafeAndReady
    };

    this.itemService.createItem(itemData).subscribe({
      next: response => {
        this.saving = false;
        this.createdItem = response.item;
        this.successMessage = response.message || 'Barang berhasil disimpan ke katalog.';
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Barang gagal disimpan. Coba lagi.';
      }
    });
  }
}
