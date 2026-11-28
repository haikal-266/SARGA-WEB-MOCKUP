import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Membership } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CustomSelectComponent, SelectOption } from '../custom-select/custom-select.component';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, CustomSelectComponent],
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

  orgOptions(memberships?: Membership[]): SelectOption[] {
    return (memberships || []).map(m => ({
      value: m.orgId,
      label: m.organization?.name || 'Organisasi terdaftar'
    }));
  }

  onOrganizationSelected(orgId: string): void {
    if (orgId) {
      this.authService.setActiveOrg(orgId);
    }
    this.menuOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.menuOpen = false;
    this.toastService.show('Anda telah keluar dari akun.', 'info');
    this.router.navigate(['/']);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.menuOpen = false;
  }
}
