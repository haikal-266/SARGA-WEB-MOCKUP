import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ItemService } from '../../core/services/item.service';
import { AuthService } from '../../core/services/auth.service';
import { Item } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page page-wide">
      <!-- Hero Banner Kontekstual -->
      <section class="hero" aria-labelledby="hero-heading">
        <div class="hero-content">
          <p class="kicker">Inventaris bersama</p>
          <h1 id="hero-heading">Alat bersama organisasi, tercatat sampai kembali.</h1>
          <p class="lede">
            Grup chat tenggelam, catatan pinjaman hilang. SARGA menyatukan katalog alat, pengajuan pinjaman,
            persetujuan pemilik, dan riwayat serah terima dalam satu halaman yang bisa dibaca semua anggota.
          </p>
          <div class="hero-actions">
            <a
              class="btn-primary"
              [routerLink]="currentUser() ? '/katalog' : '/auth/register'"
            >
              {{ currentUser() ? 'Buka katalog alat' : 'Daftar sebagai anggota' }}
            </a>
            <a
              class="btn-secondary"
              [routerLink]="currentUser() ? '/gabung' : '/auth/login'"
            >
              {{ currentUser() ? 'Gabung organisasi lain' : 'Masuk ke akun' }}
            </a>
          </div>
          <p class="hero-note">
            {{ heroNote() }}
          </p>
        </div>

        <!-- Live Inventory Board -->
        <div class="hero-board" aria-label="Daftar alat yang tersedia">
          <div class="board-head">
            <strong>{{ boardTitle() }}</strong>
            <span class="board-count">{{ availableItems().length }} alat</span>
          </div>

          <div *ngIf="loading" class="board-loading" role="status" aria-live="polite">
            <p>Memuat ketersediaan alat...</p>
          </div>

          <div *ngIf="!loading && availableItems().length > 0" class="board-list">
            <a
              *ngFor="let item of availableItems()"
              class="board-item"
              [routerLink]="['/katalog', item.id]"
            >
              <img
                class="board-thumb"
                [src]="imageSource(item)"
                [alt]="'Foto ' + item.name"
                loading="lazy"
                (error)="handleImageError($event)"
              />
              <span class="board-item-details">
                <strong>{{ item.name }}</strong>
                <span>Maksimal {{ item.maxDays }} hari pinjam</span>
              </span>
            </a>
          </div>

          <div *ngIf="!loading && availableItems().length === 0" class="empty board-empty">
            <p class="empty-title">Belum ada alat tersedia</p>
            <p class="empty-body">Pengurus atau anggota belum menayangkan alat di organisasi ini.</p>
          </div>

          <div class="board-foot">Status diperbarui setiap kali pinjaman disetujui atau barang dikembalikan.</div>
        </div>
      </section>

      <!-- Penjelasan 3 Langkah Pinjam -->
      <section class="section" aria-labelledby="steps-heading">
        <div class="section-head">
          <h2 id="steps-heading">Tiga langkah, tanpa tanya di grup</h2>
          <p>Alur yang sama dipakai semua organisasi: katalog, pengajuan, lalu serah terima.</p>
        </div>
        <ol class="steps">
          <li class="step">
            <span class="step-num" aria-hidden="true">01</span>
            <div>
              <strong>Cari alat yang tersedia</strong>
              <p>Cari alat yang dibutuhkan, baca kelengkapan, dan lihat siapa pemiliknya.</p>
            </div>
          </li>
          <li class="step">
            <span class="step-num" aria-hidden="true">02</span>
            <div>
              <strong>Ajukan tanggal dan keperluan</strong>
              <p>Pemilik atau pengurus menyetujui dari daftar permintaan. Tidak perlu menebak siapa yang sudah membalas.</p>
            </div>
          </li>
          <li class="step">
            <span class="step-num" aria-hidden="true">03</span>
            <div>
              <strong>Ambil, pakai, kembalikan</strong>
              <p>Pemilik mengonfirmasi pengembalian. Status alat kembali tersedia dan riwayatnya tetap tersimpan.</p>
            </div>
          </li>
        </ol>
      </section>

      <!-- Fitur yang Dicatat SARGA -->
      <section class="section" aria-labelledby="features-heading">
        <div class="section-head">
          <h2 id="features-heading">Yang dicatat SARGA</h2>
          <p>Bukan sekadar daftar barang. Setiap perubahan punya jejak yang bisa diperiksa pengurus.</p>
        </div>
        <div class="feature-list">
          <div class="feature-row">
            <div class="feature-title">Ketersediaan alat</div>
            <div class="feature-body">Status tersedia atau dipinjam, tanggal kembali, dan siapa yang sedang memegang.</div>
          </div>
          <div class="feature-row">
            <div class="feature-title">Persetujuan pemilik</div>
            <div class="feature-body">Permintaan masuk ke pemilik dan pengurus, lengkap dengan tanggal serta keperluan peminjaman.</div>
          </div>
          <div class="feature-row">
            <div class="feature-title">Riwayat transaksi</div>
            <div class="feature-body">Pengajuan, persetujuan, penolakan, dan pengembalian tercatat dengan waktu dan pelakunya.</div>
          </div>
          <div class="feature-row">
            <div class="feature-title">Pengumuman pengurus</div>
            <div class="feature-body">Jadwal pengecekan alat dan kebijakan hari libur tampil di halaman organisasi, bukan tertimbun chat.</div>
          </div>
        </div>
      </section>

      <!-- CTA Banner Kontekstual Bawah -->
      <section class="cta-band" aria-label="Aksi peminjaman">
        <div class="cta-info">
          <h2>{{ ctaTitle() }}</h2>
          <p>{{ ctaDescription() }}</p>
        </div>
        <div class="cta-actions btn-row">
          <a
            class="btn-primary"
            [routerLink]="currentUser() ? '/katalog' : '/auth/register'"
          >
            {{ currentUser() ? 'Lihat katalog' : 'Mulai daftar' }}
          </a>
          <a
            class="btn-secondary"
            routerLink="/status-akun"
          >
            Cek status akun
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 2rem;
      padding: 1.5rem 0 2.5rem;
      border-bottom: 1px solid var(--color-rule);
    }
    @media (min-width: 900px) {
      .hero {
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
        align-items: center;
        gap: 3rem;
        padding: 2.5rem 0 3.5rem;
      }
    }
    .hero h1 {
      margin: 0;
      font-size: clamp(2rem, 5vw, 3.2rem);
      line-height: 1.15;
      font-weight: 700;
      color: var(--color-ink);
      letter-spacing: -0.02em;
    }
    .hero .lede {
      max-width: 58ch;
      margin-top: 0.75rem;
      color: var(--color-muted);
      font-size: 1.02rem;
      line-height: 1.6;
    }
    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      margin-top: 1.5rem;
    }
    .hero-note {
      margin-top: 0.9rem;
      color: var(--color-muted-light);
      font-size: 0.8rem;
    }

    .hero-board {
      border: 1px solid var(--color-rule);
      border-radius: var(--radius-card);
      background: var(--color-paper);
      box-shadow: var(--shadow-floating);
      overflow: hidden;
    }
    .board-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.85rem 1.1rem;
      border-bottom: 1px solid var(--color-rule);
      background: var(--color-paper-2);
    }
    .board-head strong {
      font-size: 0.88rem;
      color: var(--color-ink);
    }
    .board-count {
      color: var(--color-muted);
      font-size: 0.78rem;
      font-weight: 500;
    }
    .board-list {
      display: flex;
      flex-direction: column;
    }
    .board-loading {
      padding: 1.5rem 1rem;
      text-align: center;
      color: var(--color-muted);
      font-size: 0.88rem;
    }
    .board-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.85rem 1.1rem;
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .board-item + .board-item {
      border-top: 1px solid var(--color-rule-2);
    }
    .board-item:hover {
      background: var(--color-paper-2);
      text-decoration: none;
    }
    .board-thumb {
      width: 56px;
      height: 44px;
      flex: 0 0 56px;
      object-fit: cover;
      border: 1px solid var(--color-rule);
      border-radius: 7px;
      background: var(--color-paper-3);
    }
    .board-item-details strong {
      display: block;
      font-size: 0.86rem;
      line-height: 1.35;
      color: var(--color-ink);
    }
    .board-item-details span {
      display: block;
      color: var(--color-muted);
      font-size: 0.76rem;
    }
    .board-foot {
      padding: 0.8rem 1.1rem;
      border-top: 1px solid var(--color-rule);
      background: var(--color-paper-2);
      font-size: 0.78rem;
      color: var(--color-muted);
      line-height: 1.4;
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly itemService = inject(ItemService);
  private readonly authService = inject(AuthService);
  private subscription = new Subscription();

  currentUser = this.authService.currentUser;
  activeMembership = this.authService.activeMembership;

  items = signal<Item[]>([]);
  loading = true;

  activeOrg = computed(() => {
    return this.activeMembership()?.organization || null;
  });

  firstName = computed(() => {
    const user = this.currentUser();
    const name = user?.fullName || user?.name || '';
    return name.trim().split(' ')[0] || '';
  });

  heroNote = computed(() => {
    const user = this.currentUser();
    const org = this.activeOrg();
    if (user) {
      return `Masuk sebagai ${user.fullName || user.name}${org ? ' di ' + org.name : ''}.`;
    }
    return 'Platform pencatatan dan sirkulasi peminjaman alat bersama komunitas dan organisasi.';
  });

  boardTitle = computed(() => {
    const org = this.activeOrg();
    return org ? `Tersedia di ${org.name}` : 'Daftar alat di jaringan SARGA';
  });

  availableItems = computed(() => {
    const org = this.activeOrg();
    const orgId = org?.id;
    return this.items()
      .filter(item => {
        if (this.itemService.isLocallyArchived(item.id)) return false;
        const isAvailable = item.status === 'TERSEDIA' || (item.status as string) === 'Tersedia';
        if (!isAvailable) return false;
        if (orgId) {
          return item.orgId === orgId || item.organizationId === orgId;
        }
        return true;
      })
      .slice(0, 4);
  });

  ctaTitle = computed(() => {
    const first = this.firstName();
    return first ? `Siap meminjam, ${first}?` : 'Punya kode undangan dari pengurus?';
  });

  ctaDescription = computed(() => {
    if (this.currentUser()) {
      return 'Katalog dan pinjaman Anda ada di organisasi yang sedang aktif. Ganti organisasi dari header bila Anda menjadi anggota lebih dari satu.';
    }
    return 'Minta kode undangan kepada pengurus organisasi. Setelah mendaftar, akun diperiksa dulu sebelum bisa meminjam.';
  });

  ngOnInit(): void {
    this.loadAvailableItems();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadAvailableItems(): void {
    this.loading = true;
    this.subscription.add(
      this.itemService.getItems().subscribe({
        next: res => {
          this.items.set(res.items || []);
          this.loading = false;
        },
        error: () => {
          this.items.set([]);
          this.loading = false;
        }
      })
    );
  }

  imageSource(item: Item): string {
    const src = item.imageUrl || item.image;
    if (!src || src === 'assets/placeholder-item.svg') return '/img/placeholder-item.svg';
    if (src.startsWith('assets/')) return '/' + src.slice('assets/'.length);
    if (src.startsWith('img/')) return '/' + src;
    return src;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.includes('placeholder-item.svg')) {
      img.src = '/img/placeholder-item.svg';
    }
  }
}
