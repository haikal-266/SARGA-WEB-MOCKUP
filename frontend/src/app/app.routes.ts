import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { CatalogComponent } from './features/catalog/catalog.component';
import { ItemDetailComponent } from './features/catalog/item-detail.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ItemCreateComponent } from './features/items/item-create.component';
import { StructureComponent } from './features/structure/structure.component';
import { AnnouncementsComponent } from './features/announcements/announcements.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'beranda',
    component: HomeComponent
  },
  {
    path: 'katalog/:id',
    component: ItemDetailComponent
  },
  {
    path: 'katalog',
    component: CatalogComponent
  },
  {
    path: 'struktur',
    component: StructureComponent,
    canActivate: [authGuard]
  },
  {
    path: 'pengumuman',
    component: AnnouncementsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'auth/login',
    component: LoginComponent
  },
  {
    path: 'login',
    redirectTo: 'auth/login'
  },
  {
    path: 'auth/register',
    component: RegisterComponent
  },
  {
    path: 'daftar',
    redirectTo: 'auth/register'
  },
  {
    path: 'status-akun',
    loadComponent: () =>
      import('./features/auth/status-akun.component').then(m => m.StatusAkunComponent)
  },
  {
    path: 'auth/status-akun',
    redirectTo: 'status-akun'
  },
  {
    path: 'gabung',
    loadComponent: () =>
      import('./features/auth/gabung.component').then(m => m.GabungComponent)
  },
  {
    path: 'auth/gabung',
    redirectTo: 'gabung'
  },
  {
    path: 'barang/tambah',
    component: ItemCreateComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tambah-barang',
    redirectTo: 'barang/tambah'
  },
  {
    path: 'edit-barang/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/item-edit.component').then(m => m.ItemEditComponent)
  },
  {
    path: 'edit-barang',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/item-edit.component').then(m => m.ItemEditComponent)
  },
  {
    path: 'form-pengajuan',
    loadComponent: () =>
      import('./features/loans/loan-request.component').then(m => m.LoanRequestComponent)
  },
  {
    path: 'pinjaman-saya',
    loadComponent: () =>
      import('./features/loans/my-loans.component').then(m => m.MyLoansComponent)
  },
  {
    path: 'barang-saya',
    loadComponent: () =>
      import('./features/items/my-items.component').then(m => m.MyItemsComponent)
  },
  {
    path: 'admin-monitoring',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/monitoring.component').then(m => m.MonitoringComponent)
  },
  {
    path: 'admin-verifikasi',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/verification.component').then(m => m.VerificationComponent)
  },
  {
    path: 'admin-anggota',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/members.component').then(m => m.MembersComponent)
  },
  {
    path: 'admin-tambah-anggota',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/member-add.component').then(m => m.MemberAddComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
