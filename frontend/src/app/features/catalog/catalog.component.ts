import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ItemService, normalizeItemImagePath } from '../../core/services/item.service';
import { Item } from '../../core/models';
import { AlertComponent } from '../../shared/alert/alert.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlertComponent, StatusBadgeComponent],
  template: `
    <div class="catalog-page">
      <header class="catalog-header">
        <div>
          <h1 class="page-title">Katalog Alat</h1>
          <p class="page-subtitle">Daftar alat dan barang inventaris milik organisasi yang dapat dipinjam.</p>
        </div>
      </header>

      <div class="search-bar">
        <label class="visually-hidden" for="catalog-search">Cari nama barang atau kode</label>
        <input
          id="catalog-search"
          type="search"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch()"
          placeholder="Cari nama barang atau kode..."
          class="search-input"
        />
      </div>

      <app-alert
        *ngIf="errorMessage"
        kind="error"
        title="Katalog belum dapat dimuat"
        [message]="errorMessage"
      />
      <a *ngIf="errorStatus === 401" routerLink="/auth/login" class="login-link">Masuk untuk melihat katalog</a>
      <button *ngIf="errorMessage && errorStatus !== 401 && errorStatus !== 403"
        type="button" class="retry-button" (click)="loadItems()">Coba lagi</button>

      <p *ngIf="loading" class="loading-state" role="status" aria-live="polite">
        Memuat katalog barang...
      </p>

      <div class="status-summary" *ngIf="!loading && !errorMessage">
        <span class="count-text">{{ items.length }} alat ditampilkan</span>
      </div>

      <div class="item-grid" *ngIf="!loading && !errorMessage && items.length > 0">
        <article class="item-card" *ngFor="let item of items; let first = first">
          <div class="image-wrapper">
            <img
              [src]="imageSource(item)"
              [alt]="'Foto ' + item.name"
              width="640"
              height="360"
              [attr.loading]="first ? 'eager' : 'lazy'"
              [attr.fetchpriority]="first ? 'high' : 'auto'"
              class="item-image"
              (error)="onImageError($event)"
            />
          </div>
          <div class="item-body">
            <app-status-badge kind="item" [status]="item.status" />
            <span class="item-code">{{ item.code }}</span>
            <h2 class="item-name">
              <a [routerLink]="['/katalog', item.id]">{{ item.name }}</a>
            </h2>
            <p class="item-desc">{{ item.description || 'Tidak ada deskripsi' }}</p>
            <div class="item-footer">
              <span class="item-location">{{ item.location || 'Lokasi belum dicantumkan' }}</span>
              <a class="detail-link" [routerLink]="['/katalog', item.id]">Lihat detail</a>
            </div>
          </div>
        </article>
      </div>

      <div class="empty-state" *ngIf="!loading && !errorMessage && items.length === 0">
          <h2>Barang tidak ditemukan</h2>
          <p>{{ searchQuery ? 'Coba kata kunci lain.' : 'Belum ada barang yang terdaftar di organisasi ini.' }}</p>
        </div>
    </div>
  `,
  styles: [`
    .catalog-page {
      padding: 1.5rem 0;
    }
    .catalog-header {
      margin-bottom: 1.5rem;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-ink);
      margin: 0 0 0.25rem 0;
    }
    .page-subtitle {
      color: var(--color-muted);
      margin: 0;
      font-size: 0.95rem;
    }
    .search-bar {
      margin-bottom: 1rem;
    }
    .visually-hidden {
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
    .search-input {
      width: 100%;
      padding: 0.875rem 1.25rem;
      border: 1px solid var(--color-muted-light);
      border-radius: var(--radius-input);
      font-size: 0.95rem;
      background-color: #ffffff;
      transition: border-color 0.15s ease;
    }
    .search-input:focus-visible {
      border-color: var(--color-focus);
      box-shadow: 0 0 0 3px var(--color-focus-ring);
    }
    .search-input:focus-visible,
    a:focus-visible,
    button:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
    .status-summary {
      margin-bottom: 1.25rem;
      font-size: 0.85rem;
      color: var(--color-muted);
    }
    .item-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      gap: 1.25rem;
    }
    .item-card {
      background: #ffffff;
      border: 1px solid var(--color-rule);
      border-radius: var(--radius-card);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow-wrap: anywhere;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .item-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-subtle);
    }
    .image-wrapper {
      position: relative;
      height: 180px;
      background: var(--color-paper-2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .item-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .item-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .item-code {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-muted);
      margin-bottom: 0.25rem;
    }
    .item-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-ink);
      margin: 0 0 0.5rem 0;
    }
    .item-name a {
      color: inherit;
      text-decoration: none;
    }
    .item-name a:hover {
      text-decoration: underline;
      text-underline-offset: 0.15em;
    }
    .item-desc {
      font-size: 0.85rem;
      color: var(--color-muted);
      line-height: 1.4;
      flex: 1;
      margin: 0 0 1rem 0;
    }
    .item-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      border-top: 1px solid var(--color-rule-2);
      padding-top: 0.75rem;
    }
    .item-location {
      font-size: 0.8rem;
      color: var(--color-muted);
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .detail-link,
    .login-link {
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      white-space: nowrap;
      min-height: 44px;
      color: var(--color-accent);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 0.15em;
    }
    .retry-button {
      min-height: 44px;
      padding: 0.5rem 0.875rem;
      border: 1px solid var(--color-muted-light);
      border-radius: var(--radius-input);
      background: #ffffff;
      color: var(--color-ink);
      cursor: pointer;
    }
    .loading-state {
      color: var(--color-ink);
      padding: 1rem 0;
    }
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--color-muted);
    }
    .empty-state h2 {
      color: var(--color-ink);
      font-size: 1.15rem;
    }
    @media (max-width: 600px) {
      .item-grid {
        grid-template-columns: 1fr;
      }
      .item-footer {
        align-items: flex-start;
        gap: 0.75rem;
        flex-direction: column;
      }
    }
  `]
})
export class CatalogComponent implements OnInit, OnDestroy {
  private itemService = inject(ItemService);
  private itemsRequest?: Subscription;
  items: Item[] = [];
  searchQuery = '';
  loading = false;
  errorMessage = '';
  errorStatus = 0;

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.itemsRequest?.unsubscribe();
    this.loading = true;
    this.errorMessage = '';
    this.errorStatus = 0;
    this.itemsRequest = this.itemService.getItems({ search: this.searchQuery.trim() }).subscribe({
      next: (res) => {
        this.items = (res.items || [])
          .map(item => this.itemService.getEffectiveItem(item))
          .filter(item => item.status !== 'DIARSIPKAN' && !this.itemService.isLocallyArchived(item.id));
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.items = [];
        this.errorStatus = error.status;
        this.errorMessage = error.status === 401
          ? 'Masuk terlebih dahulu untuk melihat katalog.'
          : error.error?.message || 'Katalog gagal dimuat. Coba lagi.';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.loadItems();
  }

  imageSource(item: Item): string {
    return normalizeItemImagePath(item.image || item.imageUrl);
  }

  onImageError(event: Event): void {
    const image = event.target;
    if (image instanceof HTMLImageElement && !image.src.endsWith('/img/placeholder-item.svg')) {
      image.src = '/img/placeholder-item.svg';
    }
  }

  ngOnDestroy(): void {
    this.itemsRequest?.unsubscribe();
  }
}
