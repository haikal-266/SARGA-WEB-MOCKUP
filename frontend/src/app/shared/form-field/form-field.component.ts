import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="form-field-group" [class.has-error]="!!error">
      <div class="label-row" *ngIf="label">
        <label [attr.for]="htmlFor" class="field-label">{{ label }}<span class="required-star" *ngIf="required" aria-hidden="true">*</span></label>
        <span class="field-badge" *ngIf="badge">{{ badge }}</span>
      </div>

      <div class="control-wrapper">
        <ng-content></ng-content>
      </div>

      <p class="field-hint" *ngIf="hint && !error">
        {{ hint }}
      </p>

      <div class="field-error-message" *ngIf="error" role="alert">
        <app-icon name="alert-circle" [size]="14" />
        <span>{{ error }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      scroll-margin-top: 6rem;
    }

    .form-field-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1.15rem;
    }

    .label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .field-label {
      font-family: var(--font-body, 'Epilogue', sans-serif);
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--color-ink, #111111);
      line-height: 1.35;
      cursor: pointer;
    }

    .required-star {
      color: var(--color-rose-ink, #e11d48);
      font-weight: 700;
      margin-left: 0.15rem;
    }

    .field-badge {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--color-muted, #475569);
      background: var(--color-paper-2, #f7f6f2);
      padding: 0.1rem 0.45rem;
      border-radius: 6px;
      border: 1px solid var(--color-rule, #e3e1da);
    }

    .control-wrapper {
      position: relative;
      width: 100%;
    }

    .field-hint {
      margin: 0;
      font-size: 0.8rem;
      color: var(--color-muted, #475569);
      line-height: 1.4;
    }

    .field-error-message {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--color-rose-ink, #e11d48);
      font-size: 0.82rem;
      font-weight: 500;
      margin-top: 0.15rem;
    }
  `]
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() htmlFor = '';
  @Input() required = false;
  @Input() hint = '';
  @Input() error = '';
  @Input() badge = '';
}
