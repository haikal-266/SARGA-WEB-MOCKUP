import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { ToastOutletComponent } from './shared/toast/toast-outlet.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, NavbarComponent, ToastOutletComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  get isLoggedIn(): boolean {
    return !!this.authService.currentUser();
  }

  get isVerified(): boolean {
    return this.authService.activeMembership()?.status === 'TERVERIFIKASI';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin() && this.isVerified;
  }

  get activeOrgName(): string {
    return this.authService.activeMembership()?.organization?.name || '';
  }
}
