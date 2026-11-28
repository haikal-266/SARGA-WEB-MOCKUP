import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Item } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ItemService, normalizeItemImagePath } from '../../core/services/item.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertComponent, StatusBadgeComponent],
  template: `
    <div class="detail-page">
      <a routerLink="/katalog" class="back-link">Kembali ke katalog</a>

      <p *ngIf="loading" class="loading-state" role="status" aria-live="polite">
        Memuat detail barang...
      </p>

      <app-alert
        *ngIf="errorMessage"
        kind="error"
        title="Detail barang belum dapat dimuat"
        [message]="errorMessage"
      />
      <a *ngIf="errorStatus === 401" routerLink="/auth/login" class="action-link">
        Masuk untuk melihat detail barang
      </a>
      <button *ngIf="errorMessage && errorStatus !== 401 && errorStatus !== 403 && errorStatus !== 404"
        type="button" class="retry-button" (click)="loadItem(itemId)">Coba lagi</button>

      <ng-container *ngIf="item && !loading">
        <article class="detail-layout">
          <div class="detail-photo">
            <img
              [src]="itemImage"
              [alt]="'Foto ' + item.name"
              width="800"
              height="600"
              fetchpriority="high"
              (error)="onImageError()"
            />
          </div>

          <section class="detail-content" aria-labelledby="item-title">
            <p class="item-code">{{ item.code }}</p>
            <h1 id="item-title">{{ item.name }}</h1>
            <app-status-badge kind="item" [status]="item.status" />
            <p class="description">{{ item.description }}</p>

            <dl class="item-facts">
              <div>
                <dt>Organisasi</dt>
                <dd>{{ item.organization?.name || 'Tidak dicantumkan' }}</dd>
              </div>
              <div>
                <dt>Lokasi pengambilan</dt>
                <dd>{{ item.location || 'Belum dicantumkan' }}</dd>
              </div>
              <div>
                <dt>Maksimal masa pinjam</dt>
                <dd>{{ item.maxDays }} hari</dd>
              </div>
              <div>
                <dt>Kelengkapan</dt>
                <dd *ngIf="contentsList.length; else noContents">
                  <ul>
                    <li *ngFor="let content of contentsList">{{ content }}</li>
                  </ul>
                </dd>
                <ng-template #noContents><dd>Belum dicantumkan</dd></ng-template>
              </div>
              <div>
                <dt>Ketentuan &amp; instruksi pemakaian</dt>
                <dd>{{ item.instructions || 'Belum dicantumkan' }}</dd>
              </div>
              <div *ngIf="item.owner?.fullName">
                <dt>Pemilik</dt>
                <dd>{{ item.owner?.fullName }}</dd>
              </div>
            </dl>

            <div class="btn-row detail-actions">
              <a
                *ngIf="canRequestLoan"
                class="btn-primary"
                routerLink="/form-pengajuan"
                [queryParams]="{ id: item.id }"
              >
                Ajukan pinjaman
              </a>
              <a *ngIf="isOwner" class="btn-secondary" routerLink="/barang-saya">
                Kelola di Barang Saya
              </a>
              <a *ngIf="canEditItem" class="btn-secondary" [routerLink]="['/edit-barang', item.id]">
                Ubah data barang
              </a>
              <a *ngIf="ownerWhatsappUrl" class="action-link" [href]="ownerWhatsappUrl" target="_blank" rel="noopener noreferrer">
                Hubungi pemilik
              </a>
            </div>
            <p *ngIf="!canRequestLoan && !isOwner && item.status !== 'TERSEDIA'" class="feature-note">
              Barang ini sedang tidak tersedia untuk dipinjam saat ini.
            </p>
          </section>
        </article>

        <section class="section-rule">
          <div class="section-head">
            <h2>Ketentuan peminjaman</h2>
            <p>Ringkasan aturan sebelum mengajukan peminjaman alat ini.</p>
          </div>
          <div class="panel panel-pad">
            <ul class="small" style="margin:0;padding-left:1.25rem;display:grid;gap:.35rem">
              <li>Pengajuan diperiksa pemilik barang atau pengurus organisasi.</li>
              <li>Pinjam paling lama {{ item.maxDays }} hari sejak tanggal mulai.</li>
              <li>Pengembalian dikonfirmasi pemilik setelah kondisi alat diperiksa.</li>
              <li>{{ item.instructions }}</li>
            </ul>
          </div>
        </section>

        <section class="section-rule">
          <div class="section-head">
            <h2>Riwayat pinjaman terakhir</h2>
            <p>Catatan sirkulasi membantu pemilik dan pengurus melihat kondisi alat.</p>
          </div>
          <div *ngIf="item.loans && item.loans.length > 0; else noLoanHistory" class="list">
            <div class="list-item row" *ngFor="let loan of item.loans">
              <div>
                <span class="cell-main">{{ loan.borrower?.fullName || 'Anggota' }}</span>
                <span class="cell-sub">{{ formatDate(loan.startDate) }} – {{ formatDate(loan.endDate) }}</span>
              </div>
              <app-status-badge kind="loan" [status]="loan.status" perspective="pemilik" />
            </div>
          </div>
          <ng-template #noLoanHistory>
            <div class="empty">
              <p class="empty-title">Belum ada riwayat pinjaman</p>
              <p class="empty-body">Alat ini belum memiliki riwayat transaksi pinjaman sebelumnya.</p>
            </div>
          </ng-template>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .detail-page {
      padding: 1.5rem 0 3rem;
    }
    .back-link,
    .action-link {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      color: var(--color-accent);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 0.15em;
    }
    .back-link {
      margin-bottom: 1.5rem;
    }
    .detail-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 2rem;
      align-items: start;
    }
    .detail-photo {
      overflow: hidden;
      aspect-ratio: 4 / 3;
      border: 1px solid var(--color-rule);
      border-radius: var(--radius-card);
      background: var(--color-paper-2);
    }
    .detail-photo img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .detail-content h1 {
      margin: 0.25rem 0 0.75rem;
      color: var(--color-ink);
      font-size: clamp(1.6rem, 3vw, 2.25rem);
      line-height: 1.2;
    }
    .item-code {
      margin: 0;
      color: var(--color-muted);
      font-family: var(--font-mono);
      font-size: 0.85rem;
    }
    .description {
      margin: 1rem 0 1.5rem;
      color: var(--color-ink);
      line-height: 1.6;
      overflow-wrap: anywhere;
    }
    .item-facts {
      margin: 0 0 1.5rem;
    }
    .item-facts > div {
      display: grid;
      grid-template-columns: minmax(9rem, 0.8fr) minmax(0, 1.2fr);
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--color-rule-2);
    }
    .item-facts dt {
      color: var(--color-muted);
    }
    .item-facts dd {
      margin: 0;
      color: var(--color-ink);
      overflow-wrap: anywhere;
    }
    .item-facts ul {
      margin: 0;
      padding-left: 1.25rem;
    }
    .loading-state {
      padding: 1rem 0;
      color: var(--color-ink);
    }
    .retry-button {
      min-height: 44px;
      margin-top: 1rem;
      padding: 0.5rem 0.875rem;
      border: 1px solid var(--color-muted-light);
      border-radius: var(--radius-input);
      background: #ffffff;
      color: var(--color-ink);
      cursor: pointer;
    }
    a:focus-visible,
    button:focus-visible {
      outline: 3px solid var(--color-focus);
      outline-offset: 2px;
    }
    @media (max-width: 700px) {
      .detail-layout {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }
      .item-facts > div {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
      .detail-actions > .btn-primary,
      .detail-actions > .btn-secondary {
        flex: 1 1 100%;
      }
    }
  `]
})
export class ItemDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly itemService = inject(ItemService);
  private routeSubscription?: Subscription;
  private itemRequest?: Subscription;

  item: Item | null = null;
  itemId = '';
  itemImage = '/img/placeholder-item.svg';
  loading = false;
  errorMessage = '';
  errorStatus = 0;

  get isOwner(): boolean {
    const userId = this.authService.currentUser()?.id;
    return !!this.item && !!userId && this.item.ownerId === userId;
  }

  get canRequestLoan(): boolean {
    return (
      !!this.item &&
      this.item.status === 'TERSEDIA' &&
      !this.itemService.isLocallyArchived(this.item.id) &&
      !this.isOwner &&
      this.authService.activeMembership()?.status === 'TERVERIFIKASI'
    );
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.itemId = params.get('id') || '';
      this.loadItem(this.itemId);
    });
  }

  get canEditItem(): boolean {
    if (!this.item) return false;
    const me = this.authService.currentUser();
    return (!!me && this.item.ownerId === me.id) || this.authService.isAdmin();
  }

  get contentsList(): string[] {
    if (!this.item?.contents) return [];
    if (Array.isArray(this.item.contents)) return this.item.contents;

    try {
      const parsed: unknown = JSON.parse(this.item.contents);
      if (Array.isArray(parsed) && parsed.every((entry): entry is string => typeof entry === 'string')) {
        return parsed;
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }

    return [this.item.contents];
  }

  get ownerWhatsappUrl(): string | null {
    const number = this.item?.owner?.waNumber?.replace(/\D/g, '');
    if (!number) return null;

    const internationalNumber = number.startsWith('62')
      ? number
      : number.startsWith('0') ? `62${number.slice(1)}` : `62${number}`;
    return `https://wa.me/${internationalNumber}`;
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  loadItem(id: string): void {
    this.itemRequest?.unsubscribe();
    this.item = null;
    this.errorMessage = '';
    this.errorStatus = 0;
    if (!id) {
      this.errorMessage = 'ID barang tidak tersedia.';
      return;
    }

    this.loading = true;
    this.itemRequest = this.itemService.getItemById(id).subscribe({
      next: response => {
        const effective = this.itemService.getEffectiveItem(response.item);
        this.item = effective;
        this.itemImage = normalizeItemImagePath(effective.image || effective.imageUrl);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorStatus = error.status;
        this.errorMessage = error.status === 401
          ? 'Masuk terlebih dahulu untuk melihat detail barang.'
          : error.error?.message || 'Detail barang gagal dimuat. Coba lagi.';
        this.loading = false;
      }
    });
  }

  onImageError(): void {
    if (this.itemImage !== '/img/placeholder-item.svg') {
      this.itemImage = '/img/placeholder-item.svg';
    }
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.itemRequest?.unsubscribe();
  }
}
