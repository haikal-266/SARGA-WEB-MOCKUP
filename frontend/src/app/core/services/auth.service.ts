import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Membership, Organization, VerificationStatus } from '../models';

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface RegisterRequest {
  waNumber: string;
  password: string;
  fullName: string;
  address?: string;
  inviteCode: string;
  documentType?: string;
  documentUrl?: string;
  documentName?: string;
  documentNote?: string;
  documentFile?: Blob | File;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private userSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.userSubject.asObservable();

  currentUser = signal<User | null>(null);
  activeMembership = signal<Membership | null>(null);

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('sarga_token');
  }

  isAdmin(): boolean {
    const membership = this.activeMembership();
    return membership?.role === 'ADMIN';
  }

  checkInviteCode(code: string): Observable<{
    success: boolean;
    message?: string;
    organization: {
      id: string;
      name: string;
      type?: string;
      address?: string;
      contact?: string;
    };
    pic: {
      name: string;
      contact: string;
      position?: string;
    };
  }> {
    const cleanCode = encodeURIComponent(code.trim().toUpperCase());
    return this.http.get<{
      success: boolean;
      message?: string;
      organization: {
        id: string;
        name: string;
        type?: string;
        address?: string;
        contact?: string;
      };
      pic: {
        name: string;
        contact: string;
        position?: string;
      };
    }>(`${this.apiUrl}/invite/${cleanCode}`);
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    let payload: RegisterRequest | FormData = data;
    if (data.documentFile) {
      const formData = new FormData();
      formData.append('waNumber', data.waNumber);
      formData.append('password', data.password);
      formData.append('fullName', data.fullName);
      formData.append('inviteCode', data.inviteCode);
      if (data.address) formData.append('address', data.address);
      if (data.documentType) formData.append('documentType', data.documentType);
      if (data.documentName) formData.append('documentName', data.documentName);
      if (data.documentNote) formData.append('documentNote', data.documentNote);
      formData.append('document', data.documentFile, data.documentName || 'dokumen_identitas.jpg');
      payload = formData;
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap(response => {
        localStorage.setItem('sarga_token', response.token);
        this.setUser(response.user, response.user.memberships?.[0]?.orgId);
      })
    );
  }

  login(credentials: { waNumber: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('sarga_token', response.token);
        const memberships = response.user.memberships || [];
        const preferred =
          memberships.find(m => m.status === 'TERVERIFIKASI')?.orgId || memberships[0]?.orgId;
        this.setUser(response.user, preferred);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('sarga_token');
    localStorage.removeItem('sarga_active_org_id');
    this.setUser(null);
    this.activeMembership.set(null);
  }

  setActiveOrg(orgId: string): void {
    localStorage.setItem('sarga_active_org_id', orgId);
    const user = this.currentUser();
    if (user && user.memberships) {
      const match = user.memberships.find(m => m.orgId === orgId) || null;
      this.activeMembership.set(match);
    }
  }

  resolveOrganizationByInvite(inviteCode: string): Organization | null {
    const normalized = inviteCode.trim().toUpperCase();
    if (!normalized) return null;

    const userOrgs = (this.currentUser()?.memberships || [])
      .map(m => m.organization)
      .filter((org): org is Organization => !!org);
    const existingMatch = userOrgs.find(
      org => org.inviteCode?.toUpperCase() === normalized && org.status !== 'Nonaktif'
    );
    return existingMatch || null;
  }

  hasMembershipInOrg(org: Organization): boolean {
    const memberships = this.currentUser()?.memberships || [];
    const normalizedCode = org.inviteCode?.trim().toUpperCase();
    return memberships.some(
      m =>
        m.orgId === org.id ||
        (normalizedCode && m.organization?.inviteCode?.toUpperCase() === normalizedCode) ||
        m.organization?.name?.toLowerCase() === org.name.toLowerCase()
    );
  }

  addAdditionalMembership(membership: Membership): void {
    const user = this.currentUser();
    if (!user) return;
    const existing = user.memberships || [];
    const updatedMemberships = [...existing, membership];
    this.saveLocalMemberships(user.id, membership);
    const updatedUser: User = { ...user, memberships: updatedMemberships };
    this.setUser(updatedUser);
  }

  replaceMembership(updated: Membership): void {
    const user = this.currentUser();
    if (!user) return;
    const existing = user.memberships || [];
    const replaced = existing.some(m => m.id === updated.id || m.orgId === updated.orgId)
      ? existing.map(m => (m.id === updated.id || m.orgId === updated.orgId ? updated : m))
      : [...existing, updated];
    const updatedUser: User = {
      ...user,
      fullName: updated.user?.fullName || user.fullName,
      name: updated.user?.fullName || user.name,
      memberships: replaced
    };
    this.setUser(updatedUser, updated.orgId);
  }

  updateActiveMembershipStatus(status: VerificationStatus, rejectionReason?: string | null): void {
    const user = this.currentUser();
    const active = this.activeMembership();
    if (user && active) {
      const updatedMemberships = (user.memberships || []).map(m => {
        if (m.id === active.id) {
          return { ...m, status, rejectionReason: rejectionReason || undefined };
        }
        return m;
      });
      const updatedUser = { ...user, memberships: updatedMemberships };
      this.setUser(updatedUser, active.orgId);
    }
  }

  refreshUser(): void {
    this.loadStoredUser();
  }

  private setUser(user: User | null, preferredOrgId?: string): void {
    if (user) {
      const localExtras = this.loadLocalMemberships(user.id);
      const baseMemberships = user.memberships || [];
      const merged = [...baseMemberships];
      for (const extra of localExtras) {
        const duplicate = merged.some(
          m =>
            m.id === extra.id ||
            m.orgId === extra.orgId ||
            (extra.organization?.inviteCode &&
              m.organization?.inviteCode?.toUpperCase() === extra.organization.inviteCode.toUpperCase())
        );
        if (!duplicate) {
          merged.push(extra);
        }
      }
      user = {
        ...user,
        name: user.name || user.fullName,
        memberships: merged
      };
      // Set activeMembership before emitting on currentUser$ so direct-route subscribers see active org/role immediately.
      this.currentUser.set(user);
      const storedOrgId = preferredOrgId || localStorage.getItem('sarga_active_org_id');
      const match =
        (storedOrgId ? merged.find(m => m.orgId === storedOrgId) : undefined) ||
        merged.find(m => m.status === 'TERVERIFIKASI') ||
        merged[0] ||
        null;
      if (match) {
        localStorage.setItem('sarga_active_org_id', match.orgId);
      }
      this.activeMembership.set(match);
    } else {
      this.currentUser.set(null);
      this.activeMembership.set(null);
    }
    this.userSubject.next(user);
  }

  private localStorageKey(userId: string): string {
    return `sarga_local_memberships_${userId}`;
  }

  private loadLocalMemberships(userId: string): Membership[] {
    try {
      const raw = localStorage.getItem(this.localStorageKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveLocalMemberships(userId: string, membership: Membership): void {
    const current = this.loadLocalMemberships(userId);
    const next = [...current.filter(m => m.orgId !== membership.orgId), membership];
    try {
      localStorage.setItem(this.localStorageKey(userId), JSON.stringify(next));
    } catch {
      const compact: Membership = { ...membership, documentUrl: undefined };
      try {
        localStorage.setItem(
          this.localStorageKey(userId),
          JSON.stringify([...current.filter(m => m.orgId !== membership.orgId), compact])
        );
      } catch {
        // Ignore storage quota overflow while retaining in-memory signal state
      }
    }
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('sarga_token');
    if (token) {
      this.http.get<{ success: boolean; user: User }>(`${this.apiUrl}/me`).subscribe({
        next: (res) => {
          this.setUser(res.user);
        },
        error: () => this.logout()
      });
    }
  }
}
