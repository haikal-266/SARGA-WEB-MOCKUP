import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';
import { createMember, createOrg, createPlatformAdmin, resetDb } from './helpers';

describe('BE-MHD-04: API Direktori & Pembuatan Organisasi Platform Admin', () => {
  let platformAdmin: { user: { id: string; fullName: string; waNumber: string }; token: string };
  let regularOrg: { id: string; name: string };
  let regularAdmin: { user: { id: string; fullName: string; waNumber: string }; token: string };
  let regularMember: { user: { id: string; fullName: string; waNumber: string }; token: string };

  const authHeader = (token: string) => ({
    Authorization: `Bearer ${token}`
  });

  beforeEach(async () => {
    await resetDb();
    platformAdmin = await createPlatformAdmin({
      waNumber: '081199990001',
      fullName: 'Super Administrator Sarga'
    });

    regularOrg = await createOrg('Komunitas Warga Mandiri', 'WARGA2026');
    regularAdmin = await createMember(regularOrg.id, {
      waNumber: '081200000095',
      fullName: 'Ketua Warga Mandiri',
      role: 'ADMIN',
      position: 'Ketua RW'
    });
    regularMember = await createMember(regularOrg.id, {
      waNumber: '081200000096',
      fullName: 'Warga Biasa',
      role: 'ANGGOTA'
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/platform/organizations', () => {
    it('platform admin berhasil membaca seluruh direktori organisasi beserta agregatnya', async () => {
      await createOrg('Sekolah Alam Raya', 'SEKOLAH2026');

      const res = await request(app)
        .get('/api/v1/platform/organizations')
        .set(authHeader(platformAdmin.token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(2);
      expect(Array.isArray(res.body.organizations)).toBe(true);
      expect(res.body.organizations[0]._count).toBeDefined();
    });

    it('mendukung pencarian kata kunci q (nama, tipe, alamat, kontak)', async () => {
      await createOrg('Komunitas Fotografi Jakarta', 'FOTO2026');

      const res = await request(app)
        .get('/api/v1/platform/organizations?q=Fotografi')
        .set(authHeader(platformAdmin.token));

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.organizations[0].name).toBe('Komunitas Fotografi Jakarta');
    });

    it('menolak pengurus organisasi biasa yang bukan platform admin (403)', async () => {
      const res = await request(app)
        .get('/api/v1/platform/organizations')
        .set(authHeader(regularAdmin.token));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('admin platform');
    });

    it('menolak permintaan tanpa token otentikasi (401)', async () => {
      const res = await request(app).get('/api/v1/platform/organizations');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/platform/organizations/:id', () => {
    it('platform admin dapat melihat detail lengkap organisasi manapun', async () => {
      const res = await request(app)
        .get(`/api/v1/platform/organizations/${regularOrg.id}`)
        .set(authHeader(platformAdmin.token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.organization.id).toBe(regularOrg.id);
      expect(res.body.organization.memberships).toBeDefined();
    });

    it('mengembalikan 404 jika id organisasi tidak ditemukan', async () => {
      const res = await request(app)
        .get('/api/v1/platform/organizations/non-existent-uuid')
        .set(authHeader(platformAdmin.token));

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/platform/organizations', () => {
    it('platform admin berhasil mendaftarkan organisasi baru dan menunjuk pengurus pertama', async () => {
      const res = await request(app)
        .post('/api/v1/platform/organizations')
        .set(authHeader(platformAdmin.token))
        .send({
          name: 'RT 003 RW 009 Kemang',
          type: 'RT/RW',
          address: 'Jl. Kemang Selatan No. 12',
          contact: '081288887777',
          inviteCode: 'KEMANG03',
          firstAdminId: regularMember.user.id,
          firstAdminPosition: 'Ketua RT 003'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.organization.name).toBe('RT 003 RW 009 Kemang');
      expect(res.body.organization.inviteCode).toBe('KEMANG03');
      expect(res.body.membership.userId).toBe(regularMember.user.id);
      expect(res.body.membership.role).toBe('ADMIN');
      expect(res.body.membership.position).toBe('Ketua RT 003');
      expect(res.body.membership.status).toBe('TERVERIFIKASI');

      // Memastikan audit log terbit
      const audit = await prisma.auditLog.findFirst({
        where: { orgId: res.body.organization.id, action: 'Membuat organisasi' }
      });
      expect(audit).not.toBeNull();
      expect(audit?.actorId).toBe(platformAdmin.user.id);
    });

    it('jika firstAdminId tidak diisi, otomatis menjadikan platform admin sebagai admin pertama', async () => {
      const res = await request(app)
        .post('/api/v1/platform/organizations')
        .set(authHeader(platformAdmin.token))
        .send({
          name: 'Organisasi Mandiri Baru',
          type: 'Komunitas',
          address: 'Jl. Merdeka Barat No. 10',
          contact: '081300001111'
        });

      expect(res.status).toBe(201);
      expect(res.body.membership.userId).toBe(platformAdmin.user.id);
      expect(res.body.membership.role).toBe('ADMIN');
      expect(res.body.organization.inviteCode).toBeDefined();
    });

    it('validasi: menolak jika nama kosong atau alamat kosong (400)', async () => {
      const res = await request(app)
        .post('/api/v1/platform/organizations')
        .set(authHeader(platformAdmin.token))
        .send({
          name: '',
          address: 'Jl. Uji',
          contact: '081200000000'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('validasi: menolak duplikasi kode undangan kustom (409)', async () => {
      const res = await request(app)
        .post('/api/v1/platform/organizations')
        .set(authHeader(platformAdmin.token))
        .send({
          name: 'Organisasi Kode Kembar',
          address: 'Jl. Uji No. 8',
          contact: '081200000000',
          inviteCode: 'WARGA2026' // sudah dipakai regularOrg
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('sudah digunakan');
    });

    it('menolak pengurus biasa / non-platform-admin yang mencoba membuat organisasi via endpoint platform (403)', async () => {
      const res = await request(app)
        .post('/api/v1/platform/organizations')
        .set(authHeader(regularAdmin.token))
        .send({
          name: 'Organisasi Ilegal',
          address: 'Jl. Hantu No. 0',
          contact: '081200000000'
        });

      expect(res.status).toBe(403);
    });
  });
});
