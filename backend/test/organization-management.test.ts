import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';
import { createMember, createOrg, resetDb } from './helpers';

describe('BE-MHD-03: API Pengaturan Organisasi & Acak Kode Undangan', () => {
  let orgA: { id: string; name: string; type: string; address: string; contact: string; inviteCode: string };
  let adminA: { user: { id: string; fullName: string; waNumber: string }; token: string };
  let memberA: { user: { id: string; fullName: string; waNumber: string }; token: string };

  const auth = (token: string, orgId: string) => ({
    Authorization: `Bearer ${token}`,
    'x-organization-id': orgId
  });

  beforeEach(async () => {
    await resetDb();
    orgA = await createOrg('Komunitas Pengaturan Uji', 'SETTINGORG2026');
    adminA = await createMember(orgA.id, {
      waNumber: '081200000091',
      fullName: 'Ketua Pengatur',
      role: 'ADMIN',
      position: 'Ketua Umum'
    });
    memberA = await createMember(orgA.id, {
      waNumber: '081200000092',
      fullName: 'Anggota Pengatur',
      role: 'ANGGOTA',
      position: 'Anggota Reguler'
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/organizations/:id', () => {
    it('mengembalikan detail organisasi dan agregat data untuk anggota terverifikasi', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${orgA.id}`)
        .set(auth(memberA.token, orgA.id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.organization.id).toBe(orgA.id);
      expect(res.body.organization.name).toBe(orgA.name);
      expect(res.body.organization.inviteCode).toBe('SETTINGORG2026');
      expect(res.body.organization._count.memberships).toBe(2);
    });

    it('menolak akses ke organisasi lain (403)', async () => {
      const orgB = await createOrg('Komunitas Sebelah', 'SEBELAH2026');
      const res = await request(app)
        .get(`/api/v1/organizations/${orgB.id}`)
        .set(auth(memberA.token, orgA.id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/organizations/:id', () => {
    it('admin berhasil memperbarui profil organisasi dan mencatat audit log', async () => {
      const res = await request(app)
        .put(`/api/v1/organizations/${orgA.id}`)
        .set(auth(adminA.token, orgA.id))
        .send({
          name: 'Komunitas Pengaturan Diperbarui',
          type: 'RT/RW',
          address: 'Jl. Merdeka No. 45 Blok B',
          contact: '081299998888',
          inviteExpires: '2027-12-31T23:59:59.000Z'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.organization.name).toBe('Komunitas Pengaturan Diperbarui');
      expect(res.body.organization.type).toBe('RT/RW');
      expect(res.body.organization.address).toBe('Jl. Merdeka No. 45 Blok B');
      expect(res.body.organization.contact).toBe('081299998888');

      // Verifikasi audit log tercatat
      const audit = await prisma.auditLog.findFirst({
        where: { orgId: orgA.id, action: 'Mengubah profil organisasi' }
      });
      expect(audit).not.toBeNull();
      expect(audit?.actorId).toBe(adminA.user.id);
    });

    it('menolak anggota non-admin yang mencoba mengubah profil organisasi (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/organizations/${orgA.id}`)
        .set(auth(memberA.token, orgA.id))
        .send({ name: 'Hacked Community' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('validasi input: menolak nama terlalu pendek atau jenis tidak valid (400)', async () => {
      const resShort = await request(app)
        .put(`/api/v1/organizations/${orgA.id}`)
        .set(auth(adminA.token, orgA.id))
        .send({ name: 'AB' });
      expect(resShort.status).toBe(400);

      const resInvalidType = await request(app)
        .put(`/api/v1/organizations/${orgA.id}`)
        .set(auth(adminA.token, orgA.id))
        .send({ type: 'KategoriTidakValid' });
      expect(resInvalidType.status).toBe(400);
    });
  });

  describe('POST /api/v1/organizations/:id/regenerate-invite', () => {
    it('admin berhasil mengacak kode undangan unik baru dan mencatat audit log', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgA.id}/regenerate-invite`)
        .set(auth(adminA.token, orgA.id))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.inviteCode).toBeDefined();
      expect(res.body.inviteCode).not.toBe('SETTINGORG2026');
      expect(res.body.organization.inviteCode).toBe(res.body.inviteCode);

      // Verifikasi audit log
      const audit = await prisma.auditLog.findFirst({
        where: { orgId: orgA.id, action: 'Mengganti kode undangan' }
      });
      expect(audit).not.toBeNull();
      expect(audit?.actorId).toBe(adminA.user.id);
    });

    it('admin dapat menentukan kode undangan kustom yang belum terpakai', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgA.id}/regenerate-invite`)
        .set(auth(adminA.token, orgA.id))
        .send({ inviteCode: 'KUSTOM2026' });

      expect(res.status).toBe(200);
      expect(res.body.inviteCode).toBe('KUSTOM2026');
    });

    it('menolak kode kustom yang sudah dipakai organisasi lain (409)', async () => {
      await createOrg('Organisasi Lain', 'KODEKEMBAR2026');

      const res = await request(app)
        .post(`/api/v1/organizations/${orgA.id}/regenerate-invite`)
        .set(auth(adminA.token, orgA.id))
        .send({ inviteCode: 'KODEKEMBAR2026' });

      expect(res.status).toBe(409);
    });

    it('menolak anggota biasa yang mencoba mengacak kode undangan (403)', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgA.id}/regenerate-invite`)
        .set(auth(memberA.token, orgA.id))
        .send();

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/organizations/:id/status', () => {
    it('admin berhasil mengubah status organisasi menjadi Nonaktif dan Aktif kembali', async () => {
      const resNonaktif = await request(app)
        .patch(`/api/v1/organizations/${orgA.id}/status`)
        .set(auth(adminA.token, orgA.id))
        .send({ status: 'Nonaktif' });

      expect(resNonaktif.status).toBe(200);
      expect(resNonaktif.body.organization.status).toBe('Nonaktif');

      const resAktif = await request(app)
        .patch(`/api/v1/organizations/${orgA.id}/status`)
        .set(auth(adminA.token, orgA.id))
        .send({ status: 'Aktif' });

      expect(resAktif.status).toBe(200);
      expect(resAktif.body.organization.status).toBe('Aktif');

      // Audit log tercatat
      const auditCount = await prisma.auditLog.count({
        where: { orgId: orgA.id, action: 'Mengubah status organisasi' }
      });
      expect(auditCount).toBe(2);
    });

    it('menolak status selain Aktif atau Nonaktif (400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/organizations/${orgA.id}/status`)
        .set(auth(adminA.token, orgA.id))
        .send({ status: 'Pending' });

      expect(res.status).toBe(400);
    });
  });
});
