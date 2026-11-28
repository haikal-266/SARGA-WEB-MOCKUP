import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  forwardRef,
  inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="custom-select" [class.is-open]="open" [class.is-inline]="variant === 'inline'">
      <button
        #triggerBtn
        type="button"
        class="custom-select-trigger"
        [class.is-inline]="variant === 'inline'"
        [class.is-block]="block"
        [class.is-invalid]="invalid"
        [class.is-placeholder]="!selectedOption"
        [attr.id]="controlId || null"
        [attr.aria-label]="ariaLabel || null"
        [attr.aria-invalid]="invalid ? 'true' : null"
        [attr.aria-describedby]="ariaDescribedby || null"
        role="combobox"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open"
        [attr.aria-controls]="open ? listboxId : null"
        [disabled]="disabled"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
      >
        <span class="custom-select-label">{{ selectedOption?.label || placeholder }}</span>
        <app-icon
          name="chevron-down"
          [size]="16"
          [strokeWidth]="variant === 'inline' ? 2.4 : 2"
          class="custom-select-chevron"
        />
      </button>

      <div
        *ngIf="open"
        [id]="listboxId"
        class="custom-select-menu"
        role="listbox"
        [ngStyle]="menuStyle"
        (keydown)="onMenuKeydown($event)"
      >
        <button
          *ngFor="let opt of options; let i = index; trackBy: trackByValue"
          type="button"
          class="custom-select-option"
          role="option"
          [attr.aria-selected]="opt.value === value"
          [class.is-selected]="opt.value === value"
          [class.is-active]="i === focusedIndex"
          [disabled]="!!opt.disabled"
          (mouseenter)="focusedIndex = i"
          (click)="selectOption(opt)"
        >
          <span class="option-text">{{ opt.label }}</span>
          <app-icon *ngIf="opt.value === value" name="check" [size]="15" class="option-check" />
        </button>
        <p *ngIf="options.length === 0" class="custom-select-empty">Tidak ada pilihan tersedia.</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    :host(.inline-select-host) {
      display: inline-block;
      width: auto;
    }
    .custom-select {
      position: relative;
      width: 100%;
    }
    .custom-select.is-inline {
      width: auto;
    }
    .custom-select-trigger {
      scroll-margin-top: 6rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.6rem;
      width: 100%;
      min-height: 44px;
      padding: 0.55rem 0.9rem;
      border: 1.5px solid var(--color-rule, #e3e1da);
      border-radius: 10px;
      background: #ffffff;
      color: var(--color-ink, #111111);
      font-family: var(--font-body, 'Epilogue', sans-serif);
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.4;
      text-align: left;
      cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }
    @media (min-width: 640px) {
      .custom-select-trigger:not(.is-inline) {
        font-size: 0.92rem;
      }
    }
    .custom-select-trigger.is-placeholder {
      color: var(--color-muted, #475569);
      font-weight: 500;
    }
    .custom-select-trigger:hover:not(:disabled) {
      border-color: #94a3b8;
    }
    .custom-select-trigger:focus-visible,
    .custom-select.is-open .custom-select-trigger {
      outline: none;
      border-color: #0f766e;
      box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.18);
    }
    .custom-select-trigger.is-invalid {
      border-color: var(--color-rose-ink, #e11d48);
      box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.15);
    }
    .custom-select-trigger:disabled {
      opacity: 0.6;
      background: var(--color-paper-2, #f7f6f2);
      cursor: not-allowed;
    }
    .custom-select-trigger.is-inline {
      min-height: 44px;
      max-width: 260px;
      padding: 0.5rem 0.85rem;
      border: 2px solid #0f766e;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 700;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .custom-select-trigger.is-inline:hover:not(:disabled) {
      border-color: #115e59;
      background: #f8fffe;
    }
    .custom-select-trigger.is-inline.is-block {
      width: 100%;
      max-width: 100%;
    }
    .custom-select-label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .custom-select-chevron {
      flex: 0 0 auto;
      color: var(--color-ink, #111111);
      transition: transform 0.16s ease;
    }
    .custom-select.is-open .custom-select-chevron {
      transform: rotate(180deg);
      color: #0f766e;
    }
    .custom-select-menu {
      z-index: 500;
      max-height: 240px;
      overflow-y: auto;
      padding: 0.35rem;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 14px 32px rgba(15, 23, 42, 0.14);
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
    }
    .custom-select-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.6rem;
      width: 100%;
      min-height: 42px;
      padding: 0.5rem 0.7rem;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--color-ink, #111111);
      font-family: var(--font-body, 'Epilogue', sans-serif);
      font-size: 0.9rem;
      font-weight: 500;
      line-height: 1.35;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .custom-select-option:hover:not(:disabled),
    .custom-select-option.is-active:not(:disabled) {
      background: #f1f5f9;
    }
    .custom-select-option.is-selected {
      background: #f0fdfa;
      color: #0f766e;
      font-weight: 700;
    }
    .custom-select-option.is-selected:hover:not(:disabled) {
      background: #e6f7f4;
    }
    .custom-select-option:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .option-text {
      flex: 1 1 auto;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .option-check {
      flex: 0 0 auto;
      color: #0f766e;
    }
    .custom-select-empty {
      margin: 0;
      padding: 0.75rem;
      font-size: 0.85rem;
      color: var(--color-muted, #475569);
      text-align: center;
    }
  `]
})
export class CustomSelectComponent implements ControlValueAccessor, OnDestroy {
  private static nextId = 0;
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly ngZone = inject(NgZone);

  @ViewChild('triggerBtn') private triggerBtn?: ElementRef<HTMLButtonElement>;

  @HostBinding('attr.id') readonly clearHostId = null;
  @HostBinding('class.inline-select-host')
  get isInlineHost(): boolean {
    return this.variant === 'inline' && !this.block;
  }

  @Input('id') controlId = '';
  @Input() options: ReadonlyArray<SelectOption> = [];
  @Input() value = '';
  @Input() placeholder = 'Pilih opsi';
  @Input() disabled = false;
  @Input() variant: 'default' | 'inline' = 'default';
  @Input() block = false;
  @Input() invalid = false;
  @Input() ariaLabel = '';
  @Input() ariaDescribedby = '';

  @Output() valueChange = new EventEmitter<string>();

  readonly listboxId = `sarga-listbox-${++CustomSelectComponent.nextId}`;
  open = false;
  focusedIndex = -1;
  menuStyle: Record<string, string> = {};

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly scrollListener = (event: Event) => {
    if (!this.open) return;
    const target = event.target;
    if (target instanceof Node && this.hostEl.nativeElement.contains(target)) {
      return;
    }
    this.ngZone.run(() => this.close(false));
  };

  private readonly escapeCaptureListener = (event: KeyboardEvent) => {
    if (!this.open || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.ngZone.run(() => this.close(true));
  };

  constructor() {
    window.addEventListener('scroll', this.scrollListener, true);
    window.addEventListener('keydown', this.escapeCaptureListener, true);
  }

  get selectedOption(): SelectOption | undefined {
    return this.options.find(opt => opt.value === this.value);
  }

  trackByValue(_index: number, opt: SelectOption): string {
    return opt.value;
  }

  writeValue(value: string | null | undefined): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.close(false);
  }

  focus(): void {
    this.triggerBtn?.nativeElement.focus();
  }

  toggle(): void {
    if (this.disabled) return;
    if (this.open) {
      this.close(false);
    } else {
      this.openMenu();
    }
  }

  openMenu(): void {
    if (this.disabled) return;
    this.updateMenuPosition();
    const idx = this.options.findIndex(o => o.value === this.value && !o.disabled);
    this.focusedIndex = idx >= 0 ? idx : this.options.findIndex(o => !o.disabled);
    this.open = true;
  }

  close(restoreFocus = false): void {
    if (!this.open) return;
    this.open = false;
    this.onTouched();
    if (restoreFocus) {
      setTimeout(() => this.triggerBtn?.nativeElement.focus(), 0);
    }
  }

  selectOption(opt: SelectOption): void {
    if (opt.disabled) return;
    this.value = opt.value;
    this.onChange(opt.value);
    this.onTouched();
    this.valueChange.emit(opt.value);
    this.close(true);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open) {
        this.openMenu();
      } else {
        this.moveFocus(event.key === 'ArrowDown' ? 1 : -1);
      }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      if (this.open && this.focusedIndex >= 0 && this.options[this.focusedIndex]) {
        event.preventDefault();
        this.selectOption(this.options[this.focusedIndex]);
      }
    }
  }

  onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveFocus(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocus(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const target = this.options[this.focusedIndex];
      if (target) this.selectOption(target);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open) return;
    const target = event.target;
    if (target instanceof Node && !this.hostEl.nativeElement.contains(target)) {
      this.close(false);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.open) {
      this.updateMenuPosition();
    }
  }

  private moveFocus(delta: number): void {
    if (!this.options.length) return;
    let next = this.focusedIndex;
    for (let i = 0; i < this.options.length; i++) {
      next = (next + delta + this.options.length) % this.options.length;
      if (!this.options[next].disabled) {
        this.focusedIndex = next;
        break;
      }
    }
  }

  private updateMenuPosition(): void {
    const btn = this.triggerBtn?.nativeElement;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minW = this.variant === 'inline' ? 220 : rect.width;
    const width = Math.min(Math.max(rect.width, minW), vw - 16);
    const left = Math.max(8, Math.min(rect.left, vw - width - 8));
    const spaceBelow = vh - rect.bottom;
    const openUp = spaceBelow < 220 && rect.top > spaceBelow;

    this.menuStyle = {
      position: 'fixed',
      left: `${left}px`,
      width: `${width}px`,
      top: openUp ? 'auto' : `${rect.bottom + 6}px`,
      bottom: openUp ? `${vh - rect.top + 6}px` : 'auto'
    };
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollListener, true);
    window.removeEventListener('keydown', this.escapeCaptureListener, true);
  }
}
