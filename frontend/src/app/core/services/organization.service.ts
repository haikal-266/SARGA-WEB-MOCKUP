import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnnouncementListResponse,
  AnnouncementPayload,
  Announcement,
  MembershipResponse,
  StructureResponse,
  UpdateMembershipPayload
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/organizations`;

  getStructure(orgId: string): Observable<StructureResponse> {
    return this.http.get<StructureResponse>(`${this.apiUrl}/${orgId}/structure`);
  }

  getAnnouncements(): Observable<AnnouncementListResponse> {
    return this.http.get<AnnouncementListResponse>(`${environment.apiUrl}/announcements`);
  }

  /** Khusus pengurus. Judul 3-120 karakter, isi 5-2000 karakter. */
  createAnnouncement(payload: AnnouncementPayload): Observable<{ success: boolean; announcement: Announcement; message?: string }> {
    return this.http.post<{ success: boolean; announcement: Announcement; message?: string }>(
      `${environment.apiUrl}/announcements`,
      payload
    );
  }

  /** Khusus pengurus. Pengumuman organisasi lain dijawab 404 oleh server. */
  deleteAnnouncement(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${environment.apiUrl}/announcements/${id}`);
  }

  /** Khusus pengurus. Mengubah peran dan jabatan satu keanggotaan. */
  updateMembership(membershipId: string, payload: UpdateMembershipPayload): Observable<MembershipResponse> {
    return this.http.put<MembershipResponse>(`${environment.apiUrl}/memberships/${membershipId}`, payload);
  }
}
