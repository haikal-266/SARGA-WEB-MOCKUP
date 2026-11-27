import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  readonly currentUser$ = this.authService.currentUser$;
  menuOpen = false;

  get activeOrgName(): string {
    const membership = this.authService.activeMembership();
    if (membership?.organization?.name) return membership.organization.name;
    const user = this.authService.currentUser();
    return user ? 'Belum ada organisasi' : 'Organisasi';
  }

  get activeOrgId(): string {
    return this.authService.activeMembership()?.orgId ?? '';
  }

  get isVerified(): boolean {
    return this.authService.activeMembership()?.status === 'TERVERIFIKASI';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin() && this.isVerified;
  }

  get isPlatformAdmin(): boolean {
    return !!this.authService.currentUser()?.isPlatformAdmin;
  }

  get userFirstName(): string {
    const user = this.authService.currentUser();
    if (!user?.fullName) return 'Pengguna';
    return user.fullName.trim().split(/\s+/)[0];
  }

  get initials(): string {
    const user = this.authService.currentUser();
    if (!user?.fullName) return 'U';
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return user.fullName.slice(0, 2).toUpperCase();
  }

  onOrganizationChange(event: Event): void {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement && select.value) {
      this.authService.setActiveOrg(select.value);
    }
    this.menuOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.menuOpen = false;
    this.toastService.show('Anda telah keluar dari akun.', 'info');
    this.router.navigate(['/']);
  }
}
