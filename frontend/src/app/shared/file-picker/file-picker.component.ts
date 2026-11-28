import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-file-picker',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="file-picker" [class.is-disabled]="disabled || busy" [class.is-invalid]="invalid">
      <input
        #fileInput
        type="file"
        class="sr-only raw"
        [attr.id]="controlId || null"
        [attr.accept]="accept"
        [disabled]="disabled || busy"
        (change)="onFileChange($event)"
      />
      <button
        type="button"
        class="file-picker-btn"
        [disabled]="disabled || busy"
        (click)="fileInput.click()"
      >
        <app-icon name="upload" [size]="15" />
        <span>{{ busy ? 'Mengunggah...' : buttonLabel }}</span>
      </button>
      <span class="file-picker-name" [class.is-empty]="!fileName">
        {{ fileName || placeholder }}
      </span>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .file-picker {
      scroll-margin-top: 6rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-height: 44px;
      width: 100%;
      padding: 0.32rem 0.75rem 0.32rem 0.35rem;
      border: 1.5px solid var(--color-rule, #e3e1da);
      border-radius: 10px;
      background: #ffffff;
      box-sizing: border-box;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .file-picker:hover:not(.is-disabled) {
      border-color: #94a3b8;
    }
    .file-picker:focus-within {
      border-color: #0f766e;
      box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.18);
    }
    .file-picker.is-invalid {
      border-color: var(--color-rose-ink, #e11d48);
      background: #fffafa;
      box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.16);
    }
    .file-picker.is-disabled {
      opacity: 0.6;
      background: var(--color-paper-2, #f7f6f2);
    }
    .file-picker-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      flex: 0 0 auto;
      min-height: 34px;
      padding: 0.35rem 0.85rem;
      border: 1px solid var(--color-accent-border, #9fd9d1);
      border-radius: 8px;
      background: var(--color-accent-soft, #e6f7f4);
      color: var(--color-accent-soft-ink, #0f4f46);
      font-family: var(--font-body, 'Epilogue', sans-serif);
      font-size: 0.84rem;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .file-picker-btn:hover:not(:disabled) {
      background: #0f766e;
      color: #ffffff;
    }
    .file-picker-btn:disabled {
      cursor: not-allowed;
    }
    .file-picker-name {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.86rem;
      font-weight: 500;
      color: var(--color-ink, #111111);
    }
    .file-picker-name.is-empty {
      color: var(--color-muted, #475569);
    }
  `]
})
export class FilePickerComponent {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;
  @HostBinding('attr.id') readonly clearHostId = null;

  @Input('id') controlId = '';
  @Input() accept = 'image/jpeg,image/png,image/webp';
  @Input() disabled = false;
  @Input() busy = false;
  @Input() invalid = false;
  @Input() buttonLabel = 'Pilih Foto';
  @Input() placeholder = 'Belum ada file dipilih';
  @Input() fileName = '';

  @Output() fileSelected = new EventEmitter<File>();

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      this.fileSelected.emit(file);
    }
  }
}
