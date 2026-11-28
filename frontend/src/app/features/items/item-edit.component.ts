import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Item, ItemStatus } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import {
  ITEM_IMAGE_OPTIONS,
  ItemService,
  normalizeItemImagePath
} from '../../core/services/item.service';
import { MembershipService } from '../../core/services/membership.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { CustomSelectComponent, SelectOption } from '../../shared/custom-select/custom-select.component';
import { FilePickerComponent } from '../../shared/file-picker/file-picker.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ToastService } from '../../shared/toast/toast.service';
import { focusFirstInvalid } from '../../shared/utils/form-focus';

interface ItemEditForm {
  name: string;
  maxDays: number | null;
  location: string;
  status: ItemStatus;
  description: string;
  contents: string;
  instructions: string;
  image: string;
}

@Component({
  selector: 'app-item-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AlertComponent,
    CustomSelectComponent,
    FilePickerComponent,
    StatusBadgeComponent
  ],
  templateUrl: './item-edit.component.html',
  styles: [`
    .image-picker-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.75rem;
      align-items: center;
    }
    @media (min-width: 600px) {
      .image-picker-row {
        grid-template-columns: minmax(0, 1fr) 120px;
      }
    }
    .preview-thumb {
      width: 100%;
      max-width: 240px;
      height: 140px;
      border-radius: 10px;
      border: 1px solid var(--color-rule);
      overflow: hidden;
      background: var(--color-paper-2);
    }
    @media (min-width: 600px) {
      .preview-thumb {
        width: 120px;
        height: 84px;
      }
    }
    @media (max-width: 480px) {
      .edit-actions {
        flex-direction: column;
      }
      .edit-actions > * {
        width: 100%;
      }
    }
    .preview-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  `]
})
export class ItemEditComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly itemService = inject(ItemService);
  private readonly membershipService = inject(MembershipService);
  private readonly toastService = inject(ToastService);
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  private routeSub?: Subscription;
  private itemSub?: Subscription;
  private uploadSub?: Subscription;

  readonly imageOptions = ITEM_IMAGE_OPTIONS;
  uploadedImageOption: readonly [string, string] | null = null;
  uploadedFileName = '';
  uploadingPhoto = false;
  readonly statusOptions: ReadonlyArray<SelectOption> = [
    { value: 'TERSEDIA', label: 'Tersedia' },
    { value: 'DIPINJAM', label: 'Sedang Dipinjam' },
    { value: 'PERAWATAN', label: 'Perawatan' },
    { value: 'DIARSIPKAN', label: 'Diarsipkan (disembunyikan)' }
  ];

  get imageSelectOptions(): ReadonlyArray<SelectOption> {
    return this.availableImageOptions.map(([value, label]) => ({ value, label }));
  }

  item: Item | null = null;
  currentStatus: ItemStatus = 'TERSEDIA';
  loading = false;
  loadError = '';
  errorMessage = '';
  successMessage = '';
  fieldErrors = { name: '', maxDays: '', location: '', description: '', instructions: '' };

  form: ItemEditForm = {
    name: '',
    maxDays: 3,
    location: '',
    status: 'TERSEDIA',
    description: '',
    contents: '',
    instructions: '',
    image: '/img/placeholder-item.svg'
  };

  get canEdit(): boolean {
    if (!this.item) return false;
    const me = this.authService.currentUser();
    const isOwner = !!me && this.item.ownerId === me.id;
    return isOwner || this.authService.isAdmin();
  }

  get availableImageOptions(): ReadonlyArray<readonly [string, string]> {
    return this.uploadedImageOption ? [this.uploadedImageOption, ...this.imageOptions] : this.imageOptions;
  }

  get previewImage(): string {
    return normalizeItemImagePath(this.form.image);
  }

  onPhotoPicked(file: File): void {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.errorMessage = 'Format foto harus JPG, PNG, atau WebP.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Ukuran foto maksimal 5 MB.';
      return;
    }

    this.errorMessage = '';
    this.uploadingPhoto = true;
    this.uploadSub?.unsubscribe();
    this.uploadSub = this.membershipService.uploadForensicDocument(file, file.name).subscribe({
      next: res => {
        const resolved = normalizeItemImagePath(res.image.url);
        this.uploadedImageOption = [resolved, 'Foto baru diunggah'];
        this.uploadedFileName = file.name;
        this.form.image = resolved;
        this.uploadingPhoto = false;
        this.toastService.show('Foto baru berhasil diunggah.', 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.uploadingPhoto = false;
        this.errorMessage = err.error?.message || 'Gagal mengunggah foto baru.';
      }
    });
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(paramMap => {
      const paramId = paramMap.get('id');
      const queryId = this.route.snapshot.queryParamMap.get('id');
      this.loadItem(paramId || queryId || '');
    });
  }

  loadItem(id: string): void {
    this.itemSub?.unsubscribe();
    this.errorMessage = '';
    this.successMessage = '';
    this.loadError = '';
    this.uploadedFileName = '';
    this.item = null;

    if (!id) {
      this.loadError = 'ID barang belum dipilih.';
      return;
    }

    this.loading = true;
    this.itemSub = this.itemService.getItemById(id).subscribe({
      next: res => {
        const effective = this.itemService.getEffectiveItem(res.item);
        this.item = effective;
        this.currentStatus = effective.status;
        this.populateForm(effective);
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.loadError =
          err.status === 401
            ? 'Masuk terlebih dahulu untuk mengubah data barang.'
            : err.error?.message || 'Tautan barang tidak valid atau tidak ditemukan.';
      }
    });
  }

  onSave(): void {
    if (!this.item || !this.canEdit) return;
    this.errorMessage = '';
    this.successMessage = '';

    const name = this.form.name.trim();
    const location = this.form.location.trim();
    const description = this.form.description.trim();
    const instructions = this.form.instructions.trim();
    const maxDays = Number(this.form.maxDays);

    this.fieldErrors = {
      name: name ? '' : 'Nama barang wajib diisi.',
      maxDays: Number.isInteger(maxDays) && maxDays >= 1 && maxDays <= 14 ? '' : 'Maksimal hari pinjam harus 1 sampai 14 hari.',
      location: location ? '' : 'Lokasi pengambilan wajib diisi.',
      description: description ? '' : 'Deskripsi singkat wajib diisi.',
      instructions:
        !instructions
          ? 'Catatan pemakaian wajib diisi.'
          : instructions.length > 250
            ? 'Maksimal 250 karakter.'
            : ''
    };

    if (
      this.fieldErrors.name ||
      this.fieldErrors.maxDays ||
      this.fieldErrors.location ||
      this.fieldErrors.description ||
      this.fieldErrors.instructions
    ) {
      this.errorMessage = 'Periksa field wajib yang ditandai merah.';
      focusFirstInvalid(this.hostEl.nativeElement);
      return;
    }

    const contents = this.form.contents
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (this.form.status === 'DIARSIPKAN') {
      if (this.item.status === 'DIPINJAM') {
        this.errorMessage = 'Barang yang sedang dipinjam tidak bisa diarsipkan.';
        return;
      }
      this.itemService.archiveItemLocally(this.item.id);
    } else if (this.itemService.isLocallyArchived(this.item.id)) {
      this.itemService.restoreItemLocally(this.item.id, this.form.status);
    }

    this.itemService.updateItemLocally(this.item.id, {
      name,
      maxDays,
      location,
      status: this.form.status,
      description,
      contents,
      instructions,
      image: normalizeItemImagePath(this.form.image)
    });

    this.currentStatus = this.form.status;
    this.item = {
      ...this.item,
      name,
      maxDays,
      location,
      status: this.form.status,
      description,
      contents,
      instructions,
      image: normalizeItemImagePath(this.form.image)
    };

    this.successMessage = 'Data barang diperbarui pada penyimpanan lokal peramban.';
    this.toastService.show(`Data "${name}" diperbarui.`, 'success');
  }

  onArchiveItem(): void {
    if (!this.item || !this.canEdit) return;
    if (this.currentStatus === 'DIPINJAM') {
      this.errorMessage = 'Barang yang sedang dipinjam tidak bisa ditarik.';
      return;
    }
    this.itemService.archiveItemLocally(this.item.id);
    this.currentStatus = 'DIARSIPKAN';
    this.form.status = 'DIARSIPKAN';
    this.successMessage = 'Barang ditarik dari katalog aktif pada peramban ini.';
    this.toastService.show(`"${this.item.name}" ditarik dari katalog.`, 'info');
  }

  onRestoreItem(): void {
    if (!this.item || !this.canEdit) return;
    this.itemService.restoreItemLocally(this.item.id, 'TERSEDIA');
    this.currentStatus = 'TERSEDIA';
    this.form.status = 'TERSEDIA';
    this.successMessage = 'Barang ditayangkan kembali ke katalog aktif.';
    this.toastService.show(`"${this.item.name}" ditayangkan kembali.`, 'success');
  }

  private populateForm(item: Item): void {
    const normalizedImg = normalizeItemImagePath(item.image || item.imageUrl);
    const hasMatch = this.imageOptions.some(([val]) => val === normalizedImg);
    this.uploadedImageOption =
      !hasMatch && normalizedImg !== '/img/placeholder-item.svg'
        ? [normalizedImg, 'Foto unggahan barang']
        : null;
    this.form = {
      name: item.name || '',
      maxDays: item.maxDays || 3,
      location: item.location || '',
      status: item.status || 'TERSEDIA',
      description: item.description || '',
      contents: this.parseContents(item.contents).join('\n'),
      instructions: item.instructions || '',
      image: this.uploadedImageOption || hasMatch ? normalizedImg : '/img/placeholder-item.svg'
    };
  }

  private parseContents(raw: string | string[]): string[] {
    if (Array.isArray(raw)) return raw;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // Plain text fallback
    }
    return raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.itemSub?.unsubscribe();
    this.uploadSub?.unsubscribe();
  }
}
