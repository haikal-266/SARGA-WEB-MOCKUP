import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoanTransaction, Membership } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { LoanService } from '../../core/services/loan.service';
import { MembershipService, resolveDocumentUrl } from '../../core/services/membership.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ToastService } from '../../shared/toast/toast.service';
import { AdminNavComponent } from './admin-nav.component';
import { MemberDocModalComponent } from './member-doc-modal.component';
import { RejectReasonModalComponent } from './reject-reason-modal.component';

type RejectTarget =
  | { kind: 'member'; member: Membership }
  | { kind: 'loan'; loan: LoanTransaction };

@Component({
  selector: 'app-admin-verification',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AlertComponent,
    StatusBadgeComponent,
    AdminNavComponent,
    MemberDocModalComponent,
    RejectReasonModalComponent
  ],
  templateUrl: './verification.component.html'
})
export class VerificationComponent implements OnDestroy {
  readonly authService = inject(AuthService);
  private readonly membershipService = inject(MembershipService);
  private readonly loanService = inject(LoanService);
  private readonly toastService = inject(ToastService);

  private queueSub?: Subscription;
  private lastLoadedOrgId = '';

  pendingMembers: Membership[] = [];
  pendingLoans: LoanTransaction[] = [];
  failedDocIds = new Set<string>();
  loading = false;
  busy = false;
  errorMessage = '';

  selectedDocMembership: Membership | null = null;
  rejectTarget: RejectTarget | null = null;
  rejectError = '';

  constructor() {
    effect(() => {
      const membership = this.authService.activeMembership();
      const orgId = membership?.orgId || '';
      if (orgId && membership?.role === 'ADMIN' && orgId !== this.lastLoadedOrgId) {
        this.lastLoadedOrgId = orgId;
        this.loadQueues();
      }
    });
  }

  get waitingAuth(): boolean {
    return this.authService.isAuthenticated() && !this.authService.currentUser();
  }

  get orgName(): string {
    return this.authService.activeMembership()?.organization?.name || 'organisasi aktif';
  }

  get rejectTitle(): string {
    return this.rejectTarget?.kind === 'member' ? 'Tolak pendaftaran' : 'Tolak pengajuan pinjaman';
  }

  get rejectSubmitLabel(): string {
    return this.rejectTarget?.kind === 'member' ? 'Tolak pendaftaran' : 'Tolak pengajuan';
  }

  get rejectDescription(): string {
    if (this.rejectTarget?.kind === 'member') {
      return `Alasan penolakan untuk ${this.rejectTarget.member.user?.fullName || 'calon anggota'} akan dicatat pada sistem.`;
    }
    if (this.rejectTarget?.kind === 'loan') {
      return `Pengajuan ${this.rejectTarget.loan.borrower?.fullName || 'anggota'} untuk ${this.rejectTarget.loan.item?.name || 'barang'} akan ditolak.`;
    }
    return '';
  }

  get rejectPlaceholder(): string {
    return this.rejectTarget?.kind === 'member'
      ? 'Contoh: foto dokumen tidak terbaca. Silakan unggah ulang.'
      : 'Contoh: barang sedang dipakai untuk kegiatan organisasi pada tanggal tersebut.';
  }

  loadQueues(): void {
    this.queueSub?.unsubscribe();
    this.loading = true;
    this.errorMessage = '';
    this.failedDocIds.clear();

    this.queueSub = forkJoin({
      members: this.membershipService.getPendingMemberships().pipe(catchError(() => of(null))),
      loans: this.loanService.getOrganizationLoans('MENUNGGU').pipe(catchError(() => of(null)))
    }).subscribe(({ members, loans }) => {
      this.loading = false;
      if (!members || !loans) {
        this.errorMessage = 'Sebagian data verifikasi gagal diambil dari server.';
      }
      this.pendingMembers = members?.memberships || [];
      this.pendingLoans = loans?.loans || [];
    });
  }

  memberDocImg(m: Membership): string | null {
    if (this.failedDocIds.has(m.id)) return null;
    const cached = this.membershipService.getDocumentPreview(m.id, m.user?.waNumber);
    return resolveDocumentUrl(m.documentUrl || cached?.documentUrl);
  }

  memberDocType(m: Membership): string {
    const cached = this.membershipService.getDocumentPreview(m.id, m.user?.waNumber);
    return m.documentType || cached?.documentType || 'KTP / Kartu Identitas';
  }

  memberDocName(m: Membership): string {
    const cached = this.membershipService.getDocumentPreview(m.id, m.user?.waNumber);
    return m.documentName || cached?.documentName || 'Dokumen_Keanggotaan.svg';
  }

  memberDocNote(m: Membership): string {
    const cached = this.membershipService.getDocumentPreview(m.id, m.user?.waNumber);
    return m.documentNote || cached?.documentNote || '';
  }

  waHref(wa?: string): string | null {
    const digits = (wa || '').replace(/\D/g, '');
    if (!digits) return null;
    const intl = digits.startsWith('62')
      ? digits
      : digits.startsWith('0')
        ? `62${digits.slice(1)}`
        : `62${digits}`;
    return `https://wa.me/${intl}`;
  }

  formatDate(value?: string): string {
    if (!value) return 'baru-baru ini';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  openDocModal(member: Membership): void {
    this.selectedDocMembership = member;
  }

  closeDocModal(): void {
    this.selectedDocMembership = null;
  }

  onRejectFromDocModal(membershipId: string): void {
    const match = this.pendingMembers.find(m => m.id === membershipId);
    this.selectedDocMembership = null;
    if (match) {
      this.rejectTarget = { kind: 'member', member: match };
      this.rejectError = '';
    }
  }

  openRejectMember(member: Membership): void {
    this.rejectTarget = { kind: 'member', member };
    this.rejectError = '';
  }

  openRejectLoan(loan: LoanTransaction): void {
    this.rejectTarget = { kind: 'loan', loan };
    this.rejectError = '';
  }

  closeRejectModal(): void {
    this.rejectTarget = null;
    this.rejectError = '';
  }

  approveMember(membershipId: string): void {
    if (this.busy) return;
    this.busy = true;
    this.membershipService.verifyMembership(membershipId).subscribe({
      next: res => {
        this.busy = false;
        this.selectedDocMembership = null;
        this.toastService.show(res.message || 'Keanggotaan berhasil diverifikasi.', 'success');
        this.loadQueues();
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.toastService.show(err.error?.message || 'Gagal menyetujui keanggotaan.', 'error');
      }
    });
  }

  approveLoan(loanId: string): void {
    if (this.busy) return;
    this.busy = true;
    this.loanService.approveLoan(loanId).subscribe({
      next: res => {
        this.busy = false;
        this.toastService.show(res.message || 'Pengajuan pinjaman disetujui.', 'success');
        this.loadQueues();
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.toastService.show(err.error?.message || 'Gagal menyetujui pinjaman.', 'error');
      }
    });
  }

  submitReject(reason: string): void {
    if (!this.rejectTarget || this.busy) return;
    this.busy = true;
    this.rejectError = '';

    if (this.rejectTarget.kind === 'member') {
      this.membershipService.rejectMembership(this.rejectTarget.member.id, reason).subscribe({
        next: res => {
          this.busy = false;
          this.toastService.show(res.message || 'Pendaftaran anggota ditolak.', 'info');
          this.closeRejectModal();
          this.loadQueues();
        },
        error: (err: HttpErrorResponse) => {
          this.busy = false;
          this.rejectError = err.error?.message || 'Gagal menolak pendaftaran.';
        }
      });
    } else {
      this.loanService.rejectLoan(this.rejectTarget.loan.id, reason).subscribe({
        next: res => {
          this.busy = false;
          this.toastService.show(res.message || 'Pengajuan pinjaman ditolak.', 'info');
          this.closeRejectModal();
          this.loadQueues();
        },
        error: (err: HttpErrorResponse) => {
          this.busy = false;
          this.rejectError = err.error?.message || 'Gagal menolak pinjaman.';
        }
      });
    }
  }

  onImgError(membershipId: string): void {
    this.failedDocIds.add(membershipId);
  }

  ngOnDestroy(): void {
    this.queueSub?.unsubscribe();
  }
}
