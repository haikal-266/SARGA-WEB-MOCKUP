import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'check'
  | 'check-circle'
  | 'shield'
  | 'shield-check'
  | 'upload'
  | 'user'
  | 'users'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'search'
  | 'alert-circle'
  | 'info'
  | 'x'
  | 'image'
  | 'building'
  | 'phone'
  | 'id-card'
  | 'refresh'
  | 'file-text'
  | 'log-out'
  | 'calendar'
  | 'sparkles';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      [class]="'app-icon icon-' + name"
      aria-hidden="true"
    >
      <!-- Chevron Down -->
      <ng-container *ngIf="name === 'chevron-down'">
        <path d="m6 9 6 6 6-6"/>
      </ng-container>

      <!-- Chevron Up -->
      <ng-container *ngIf="name === 'chevron-up'">
        <path d="m18 15-6-6-6 6"/>
      </ng-container>

      <!-- Chevron Left -->
      <ng-container *ngIf="name === 'chevron-left'">
        <path d="m15 18-6-6 6-6"/>
      </ng-container>

      <!-- Chevron Right -->
      <ng-container *ngIf="name === 'chevron-right'">
        <path d="m9 18 6-6-6-6"/>
      </ng-container>

      <!-- Check -->
      <ng-container *ngIf="name === 'check'">
        <path d="M20 6 9 17l-5-5"/>
      </ng-container>

      <!-- Check Circle -->
      <ng-container *ngIf="name === 'check-circle'">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <path d="m9 11 3 3L22 4"/>
      </ng-container>

      <!-- Shield / Shield Check -->
      <ng-container *ngIf="name === 'shield' || name === 'shield-check'">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
        <path *ngIf="name === 'shield-check'" d="m9 12 2 2 4-4"/>
      </ng-container>

      <!-- Upload -->
      <ng-container *ngIf="name === 'upload'">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" x2="12" y1="3" y2="15"/>
      </ng-container>

      <!-- User -->
      <ng-container *ngIf="name === 'user'">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </ng-container>

      <!-- Users -->
      <ng-container *ngIf="name === 'users'">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </ng-container>

      <!-- Lock -->
      <ng-container *ngIf="name === 'lock'">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </ng-container>

      <!-- Eye -->
      <ng-container *ngIf="name === 'eye'">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
      </ng-container>

      <!-- Eye Off -->
      <ng-container *ngIf="name === 'eye-off'">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
        <line x1="2" x2="22" y1="2" y2="22"/>
      </ng-container>

      <!-- Search -->
      <ng-container *ngIf="name === 'search'">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
      </ng-container>

      <!-- Alert Circle -->
      <ng-container *ngIf="name === 'alert-circle'">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" x2="12" y1="8" y2="12"/>
        <line x1="12" x2="12.01" y1="16" y2="16"/>
      </ng-container>

      <!-- Info -->
      <ng-container *ngIf="name === 'info'">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </ng-container>

      <!-- X -->
      <ng-container *ngIf="name === 'x'">
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
      </ng-container>

      <!-- Image -->
      <ng-container *ngIf="name === 'image'">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </ng-container>

      <!-- Building -->
      <ng-container *ngIf="name === 'building'">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
        <path d="M6 12H4a2 2 0 0 0-2 2v8h4"/>
        <path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/>
        <path d="M10 6h4"/>
        <path d="M10 10h4"/>
        <path d="M10 14h4"/>
        <path d="M10 18h4"/>
      </ng-container>

      <!-- Phone -->
      <ng-container *ngIf="name === 'phone'">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </ng-container>

      <!-- ID Card -->
      <ng-container *ngIf="name === 'id-card'">
        <rect width="20" height="14" x="2" y="5" rx="2"/>
        <line x1="2" x2="22" y1="10" y2="10"/>
        <circle cx="7" cy="15" r="1"/>
        <line x1="12" x2="17" y1="15" y2="15"/>
      </ng-container>

      <!-- Refresh -->
      <ng-container *ngIf="name === 'refresh'">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M8 16H3v5"/>
      </ng-container>

      <!-- File Text -->
      <ng-container *ngIf="name === 'file-text'">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
        <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
        <path d="M10 9H8"/>
        <path d="M16 13H8"/>
        <path d="M16 17H8"/>
      </ng-container>

      <!-- Log Out -->
      <ng-container *ngIf="name === 'log-out'">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" x2="9" y1="12" y2="12"/>
      </ng-container>

      <!-- Sparkles -->
      <ng-container *ngIf="name === 'sparkles'">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      vertical-align: middle;
    }
    .app-icon {
      display: inline-block;
      flex-shrink: 0;
      color: inherit;
    }
  `]
})
export class IconComponent {
  @Input() name: IconName = 'info';
  @Input() size: number = 18;
  @Input() strokeWidth: number = 2;
}
