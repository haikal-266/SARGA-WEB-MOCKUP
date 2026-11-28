import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Membership,
  Organization,
  Role,
  StructureMemberEntry,
  VerificationStatus
} from '../models';

export interface PendingMembershipsResponse {
  success: boolean;
  count: number;
  memberships: Membership[];
  message?: string;
}

export interface MembershipActionResponse {
  success: boolean;
  membership: Membership;
  message?: string;
}

export interface OrganizationStructureResponse {
  success: boolean;
  organization: Organization;
  leaders: StructureMemberEntry[];
  members: StructureMemberEntry[];
}

export interface UploadedImageResponse {
  success: boolean;
  image: {
    path: string;
    url: string;
    name: string;
    watermarkText: string;
  };
  message?: string;
}

export interface StoredDocumentPreview {
  documentType: string;
  documentName: string;
  documentUrl: string;
  documentNote?: string;
  watermarkSummary?: string;
  fingerprint?: string;
  savedAt: string;
}

export interface LocalManualMemberInput {
  orgId: string;
  fullName: string;
  waNumber: string;
  address?: string;
  role: Role;
  position: string;
}

export interface ResubmitMembershipInput {
  fullName?: string;
  address?: string;
  documentType?: string;
  documentName?: string;
  documentNote?: string;
  documentUrl?: string;
  documentFile?: Blob | File;
}

/** Resolves relative `/uploads/...` or asset document paths into browser-loadable URLs. */
export function resolveDocumentUrl(source?: string | null): string | null {
  if (!source) return null;
  const trimmed = source.trim();
  if (!trimmed) return null;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  const apiOrigin = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  if (trimmed.startsWith('/uploads/')) return `${apiOrigin}${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `${apiOrigin}/${trimmed}`;
  if (trimmed.startsWith('/assets/img/')) return `/${trimmed.slice('/assets/'.length)}`;
  if (trimmed.startsWith('assets/')) return `/${trimmed.slice('assets/'.length)}`;
  if (trimmed.startsWith('img/')) return `/${trimmed}`;
  return trimmed;
}

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private readonly http = inject(HttpClient);
  private readonly membershipsUrl = `${environment.apiUrl}/memberships`;
  private readonly organizationsUrl = `${environment.apiUrl}/organizations`;
  private readonly uploadsUrl = `${environment.apiUrl}/uploads`;

  private readonly localMembersKey = 'sarga_local_manual_members';
  private readonly localMemberOverridesKey = 'sarga_local_member_overrides';
  private readonly localDocMetaKey = 'sarga_local_doc_previews';

  getPendingMemberships(): Observable<PendingMembershipsResponse> {
    return this.http.get<PendingMembershipsResponse>(`${this.membershipsUrl}/pending`);
  }

  verifyMembership(membershipId: string): Observable<MembershipActionResponse> {
    return this.http.patch<MembershipActionResponse>(`${this.membershipsUrl}/verify`, { membershipId });
  }

  rejectMembership(membershipId: string, rejectionReason: string): Observable<MembershipActionResponse> {
    return this.http.patch<MembershipActionResponse>(`${this.membershipsUrl}/reject`, {
      membershipId,
      rejectionReason
    });
  }

  resubmitMembership(
    membershipId: string,
    data: ResubmitMembershipInput
  ): Observable<MembershipActionResponse> {
    const formData = new FormData();
    if (data.fullName) formData.append('fullName', data.fullName);
    if (data.address) formData.append('address', data.address);
    if (data.documentType) formData.append('documentType', data.documentType);
    if (data.documentName) formData.append('documentName', data.documentName);
    if (data.documentNote !== undefined) formData.append('documentNote', data.documentNote);
    if (data.documentFile) {
      formData.append('document', data.documentFile, data.documentName || 'dokumen_identitas.jpg');
    } else if (data.documentUrl) {
      formData.append('documentUrl', data.documentUrl);
    }
    return this.http.post<MembershipActionResponse>(
      `${this.membershipsUrl}/${membershipId}/resubmit`,
      formData
    );
  }

  updateMembershipRolePosition(
    membershipId: string,
    role: Role,
    position: string
  ): Observable<MembershipActionResponse> {
    return this.http.put<MembershipActionResponse>(`${this.membershipsUrl}/${membershipId}`, {
      role,
      position
    });
  }

  getOrganizationStructure(orgId: string): Observable<OrganizationStructureResponse> {
    return this.http.get<OrganizationStructureResponse>(`${this.organizationsUrl}/${orgId}/structure`);
  }

  uploadForensicDocument(file: Blob, fileName: string): Observable<UploadedImageResponse> {
    const formData = new FormData();
    formData.append('image', file, fileName);
    return this.http.post<UploadedImageResponse>(this.uploadsUrl, formData);
  }

  /**
   * Resolves document metadata cached on this device (from canvas watermarking / registration)
   * when the backend membership record does not yet store identity attachment fields.
   */
  saveDocumentPreview(key: string, meta: StoredDocumentPreview): void {
    const all = this.readJson<Record<string, StoredDocumentPreview>>(this.localDocMetaKey, {});
    all[key] = meta;
    this.writeJson(this.localDocMetaKey, all);
  }

  getDocumentPreview(membershipId?: string, waNumber?: string): StoredDocumentPreview | null {
    const all = this.readJson<Record<string, StoredDocumentPreview>>(this.localDocMetaKey, {});
    if (membershipId && all[membershipId]) return all[membershipId];
    if (waNumber && all[`wa:${waNumber}`]) return all[`wa:${waNumber}`];
    return null;
  }

  getLocalManualMembers(orgId: string): Membership[] {
    const list = this.readJson<Membership[]>(this.localMembersKey, []);
    return list.filter(m => m.orgId === orgId);
  }

  addLocalManualMember(input: LocalManualMemberInput): Membership {
    const all = this.readJson<Membership[]>(this.localMembersKey, []);
    const now = new Date().toISOString();
    const id = `local-mem-${Date.now()}`;
    const userId = `local-usr-${Date.now()}`;
    const entry: Membership = {
      id,
      userId,
      orgId: input.orgId,
      role: input.role,
      position: input.position.trim() || 'Anggota',
      status: 'TERVERIFIKASI',
      address: input.address?.trim() || undefined,
      joinedAt: now,
      createdAt: now,
      isLocalOnly: true,
      user: {
        id: userId,
        fullName: input.fullName.trim(),
        waNumber: input.waNumber.trim(),
        address: input.address?.trim() || undefined
      }
    };
    all.unshift(entry);
    this.writeJson(this.localMembersKey, all);
    return entry;
  }

  updateLocalManualMember(
    membershipId: string,
    patch: Partial<Pick<Membership, 'role' | 'position' | 'status'>>
  ): void {
    const all = this.readJson<Membership[]>(this.localMembersKey, []);
    const next = all.map(m => (m.id === membershipId ? { ...m, ...patch } : m));
    this.writeJson(this.localMembersKey, next);
  }

  getLocalMemberOverrides(): Record<string, { status?: VerificationStatus; role?: Role; position?: string }> {
    return this.readJson<Record<string, { status?: VerificationStatus; role?: Role; position?: string }>>(
      this.localMemberOverridesKey,
      {}
    );
  }

  saveLocalMemberOverride(
    key: string,
    patch: { status?: VerificationStatus; role?: Role; position?: string }
  ): void {
    const all = this.getLocalMemberOverrides();
    all[key] = { ...(all[key] ?? {}), ...patch };
    this.writeJson(this.localMemberOverridesKey, all);
  }

  private readJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private writeJson(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota errors
    }
  }
}
