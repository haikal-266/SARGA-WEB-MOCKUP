import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WatermarkedDocumentOutput } from '../../../core/models';
import { IconComponent } from '../../icon/icon.component';
import {
  formatWibTimestamp,
  generateDocumentFingerprint,
  renderWatermarkedDocument
} from './watermark-renderer';

@Component({
  selector: 'app-id-watermark-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './id-watermark-canvas.component.html',
  styleUrl: './id-watermark-canvas.component.css'
})
export class IdWatermarkCanvasComponent implements OnChanges, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  @Input() organizationName = 'Organisasi SARGA';
  @Input() picName = '';
  @Input() picContact = '';
  @Input() picPosition = 'Ketua / Pengurus Utama';
  @Input() documentType = 'KTP';
  @Input() initialImageUrl = '';
  @Input() invalid = false;

  @Output() processed = new EventEmitter<WatermarkedDocumentOutput>();
  @Output() documentCleared = new EventEmitter<void>();

  @ViewChild('editorCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  imageLoaded = false;
  errorMessage = '';
  fingerprint = generateDocumentFingerprint();
  sourceFileName = 'dokumen_identitas.jpg';

  private loadedImage: HTMLImageElement | null = null;
  private activeObjectUrl: string | null = null;

  get effectiveOrgName(): string {
    return this.organizationName.trim() || 'Organisasi SARGA';
  }

  get effectivePicName(): string {
    return this.picName.trim() || 'Pengurus Organisasi';
  }

  get effectivePicContact(): string {
    return this.picContact.trim() || 'Kontak Resmi Pengurus';
  }

  get effectivePicPosition(): string {
    return this.picPosition.trim() || 'Pengurus Utama';
  }

  get previewStampHeader(): string {
    return `HANYA UNTUK VERIFIKASI KEANGGOTAAN SARGA ${this.effectiveOrgName.toUpperCase()}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialImageUrl'] && this.initialImageUrl && !this.imageLoaded) {
      this.loadImageUrl(this.initialImageUrl, 'Dokumen_Keanggotaan.svg');
      return;
    }
    if (
      this.imageLoaded &&
      (changes['organizationName'] ||
        changes['picName'] ||
        changes['picContact'] ||
        changes['picPosition'] ||
        changes['documentType'])
    ) {
      this.renderAndEmit();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.errorMessage = '';
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Berkas harus berupa gambar foto (JPEG, PNG, atau WebP).';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Ukuran gambar maksimal 5 MB.';
      input.value = '';
      return;
    }

    this.revokeObjectUrl();
    this.activeObjectUrl = URL.createObjectURL(file);
    this.loadImageUrl(this.activeObjectUrl, file.name);
    input.value = '';
  }

  loadImageUrl(url: string, fileName: string): void {
    this.errorMessage = '';
    const img = new Image();
    if (/^https?:\/\//i.test(url)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      this.ngZone.run(() => {
        this.loadedImage = img;
        this.sourceFileName = fileName;
        this.fingerprint = generateDocumentFingerprint();
        this.imageLoaded = true;
        // Flush *ngIf so #editorCanvas is mounted synchronously under zone event coalescing.
        this.cdr.detectChanges();
        this.renderAndEmit();
      });
    };
    img.onerror = () => {
      this.ngZone.run(() => {
        this.errorMessage = 'Gambar tidak dapat dimuat. Pastikan berkas gambar valid.';
        this.imageLoaded = false;
        this.cdr.detectChanges();
      });
    };
    img.src = url;
  }

  resetAll(): void {
    this.revokeObjectUrl();
    this.loadedImage = null;
    this.imageLoaded = false;
    this.errorMessage = '';
    this.documentCleared.emit();
  }

  renderAndEmit(): void {
    const canvas = this.canvasRef?.nativeElement;
    const img = this.loadedImage;
    if (!canvas || !img) return;

    const config = {
      organizationName: this.effectiveOrgName,
      picName: this.effectivePicName,
      picContact: this.effectivePicContact,
      picPosition: this.effectivePicPosition,
      fingerprint: this.fingerprint,
      watermarkEnabled: true,
      applyGrayscale: true
    };

    // Konversi Grayscale + Watermark Forensik
    renderWatermarkedDocument(canvas, img, config);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
      canvas.toBlob(
        blob => {
          this.ngZone.run(() => {
            if (!blob) return;
            const sanitizedBase = this.sourceFileName
              .replace(/\.[^.]+$/, '')
              .replace(/[^a-zA-Z0-9_-]/g, '_');
            const outName = `${sanitizedBase || 'identitas'}_terwatermark.jpg`;
            const file = new File([blob], outName, { type: 'image/jpeg' });
            const summary = `${this.previewStampHeader} | PJ: ${this.effectivePicName} (${this.effectivePicContact}) | ${formatWibTimestamp()} | ID: ${this.fingerprint}`;

            this.processed.emit({
              dataUrl,
              blob,
              file,
              fileName: outName,
              documentType: this.documentType,
              watermarkSummary: summary,
              fingerprint: this.fingerprint
            });
          });
        },
        'image/jpeg',
        0.86
      );
    } catch {
      this.errorMessage = 'Gagal memproses gambar. Gunakan foto format JPG atau PNG dari perangkat Anda.';
    }
  }

  private revokeObjectUrl(): void {
    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
      this.activeObjectUrl = null;
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }
}
