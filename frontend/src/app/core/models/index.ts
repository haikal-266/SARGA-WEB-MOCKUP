export type Role = 'ANGGOTA' | 'ADMIN';

export type VerificationStatus = 'MENUNGGU_VERIFIKASI' | 'TERVERIFIKASI' | 'DITOLAK';

export type ItemStatus = 'TERSEDIA' | 'DIPINJAM' | 'PERAWATAN' | 'DIARSIPKAN';

export type LoanStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'AKTIF' | 'SELESAI' | 'DIBATALKAN';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface User {
  id: string;
  waNumber: string;
  fullName: string;
  name?: string; // alias for template convenience
  address?: string;
  /** Penanda admin platform. Backend belum mengirim field ini (BE-MHD-04), jadi opsional. */
  isPlatformAdmin?: boolean;
  memberships?: Membership[];
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  address: string;
  contact: string;
  inviteCode: string;
  status: string;
}

export interface Membership {
  id: string;
  userId: string;
  orgId: string;
  role: Role;
  position: string;
  status: VerificationStatus;
  joinedAt?: string;
  rejectionReason?: string;
  documentType?: string;
  documentUrl?: string;
  documentName?: string;
  documentNote?: string;
  address?: string;
  createdAt?: string;
  user?: {
    id: string;
    fullName: string;
    waNumber: string;
    address?: string;
  };
  organization?: Organization;
  isLocalOnly?: boolean;
}

export interface Item {
  id: string;
  code: string;
  orgId: string;
  organizationId?: string; // alias
  ownerId?: string | null;
  name: string;
  maxDays: number;
  location: string;
  status: ItemStatus;
  description: string;
  contents: string | string[];
  instructions: string;
  image: string;
  imageUrl?: string; // alias
  isSafeAndReady: boolean;
  totalStock?: number;
  availableStock?: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: { id: string; fullName: string; waNumber: string };
  organization?: { id: string; name: string };
  loans?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: LoanStatus;
    purpose?: string;
    borrower?: { id: string; fullName: string };
  }>;
}

export interface LoanTransaction {
  id: string;
  orgId: string;
  itemId: string;
  borrowerId: string;
  ownerId?: string | null;
  startDate: string;
  endDate: string;
  status: LoanStatus;
  purpose: string;
  rejectionReason?: string;
  conditionNote?: string;
  returnConfirmedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isOverdue?: boolean;
  daysOverdue?: number;
  item?: Item;
  borrower?: { id: string; fullName: string; waNumber: string };
  owner?: { id: string; fullName: string; waNumber: string } | null;
}

export interface StructureMemberEntry {
  id?: string;
  userId: string;
  fullName: string;
  waNumber: string;
  role: Role;
  position: string;
  division?: string | null;
  joinedAt: string;
}

export interface WatermarkedDocumentOutput {
  dataUrl: string;
  blob: Blob;
  file: File;
  fileName: string;
  documentType: string;
  watermarkSummary: string;
  fingerprint: string;
  redactionCount: number;
}

export interface StructureMember {
  id: string;
  userId: string;
  fullName: string;
  waNumber: string;
  position: string;
  division: string | null;
  role: Role;
  joinedAt: string;
}

export interface StructureResponse {
  success: boolean;
  organization: Organization & { inviteCode?: string; inviteExpires?: string | null };
  leaders: StructureMember[];
  members: StructureMember[];
  message?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: { id: string; fullName: string };
}

export interface AnnouncementListResponse {
  success: boolean;
  count: number;
  announcements: Announcement[];
}

export interface AnnouncementPayload {
  title: string;
  content: string;
}

export interface UpdateMembershipPayload {
  role: Role;
  position: string;
}

export interface MembershipResponse {
  success: boolean;
  membership: Membership;
  message?: string;
}
