import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';
import { createMember, createOrg, resetDb } from './helpers';

describe('Health, Auth (Invite PIC, Register, Login, Me, Password) & Items API', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/health mengembalikan status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  describe('Auth & Invite PIC Lookup', () => {
    it('GET /api/v1/auth/invite/:code mengutamakan pengurus berjabatan Ketua sebagai PIC resmi', async () => {
      const org = await createOrg('Komunitas Graha Test', 'GRAHATEST');
      await createMember(org.id, {
        waNumber: '081200000001',
        fullName: 'Sekretaris Awal',
        role: 'ADMIN',
        position: 'Sekretaris',
        joinedAt: new Date('2026-01-01T00:00:00Z')
      });
      await createMember(org.id, {
        waNumber: '081200000099',
        fullName: 'Ketua Utama',
        role: 'ADMIN',
        position: 'Ketua / Pengurus Utama',
        joinedAt: new Date('2026-01-05T00:00:00Z')
      });

      const res = await request(app).get('/api/v1/auth/invite/grahATest');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.organization.name).toBe('Komunitas Graha Test');
      expect(res.body.pic).toEqual({
        name: 'Ketua Utama',
        contact: '081200000099',
        position: 'Ketua / Pengurus Utama'
      });
    });

    it('GET /api/v1/auth/invite/:code menolak organisasi nonaktif dan kode kedaluwarsa', async () => {
      await prisma.organization.create({
        data: {
          name: 'Org Nonaktif',
          inviteCode: 'NONAKTIF26',
          type: 'Komunitas',
          address: 'Jl. X',
          contact: '081200000002',
          status: 'Nonaktif'
        }
      });
      await prisma.organization.create({
        data: {
          name: 'Org Expired',
          inviteCode: 'EXPIRED26',
          type: 'Komunitas',
          address: 'Jl. Y',
          contact: '081200000003',
          status: 'Aktif',
          inviteExpires: new Date('2020-01-01T00:00:00Z')
        }
      });

      const resInactive = await request(app).get('/api/v1/auth/invite/NONAKTIF26');
      expect(resInactive.status).toBe(404);

      const resExpired = await request(app).get('/api/v1/auth/invite/EXPIRED26');
      expect(resExpired.status).toBe(400);

      const resMissing = await request(app).get('/api/v1/auth/invite/TIDAKADA');
      expect(resMissing.status).toBe(404);
    });

    it('POST /api/v1/auth/register, login, /me, dan PUT /password bekerja end-to-end', async () => {
      const org = await createOrg('Org Registrasi', 'REGTEST26');

      const regRes = await request(app).post('/api/v1/auth/register').send({
        waNumber: '081288887777',
        password: 'Password123!',
        fullName: 'Calon Uji',
        address: 'Blok A1',
        inviteCode: 'regtest26',
        documentType: 'KTP',
        documentName: 'ktp_disensor.jpg',
        documentUrl: 'data:image/jpeg;base64,AAAA'
      });
      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.token).toBeTruthy();
      expect(regRes.body.user.address).toBe('Blok A1');
      expect(regRes.body.user.memberships[0]).toMatchObject({
        orgId: org.id,
        status: 'MENUNGGU_VERIFIKASI',
        documentType: 'KTP',
        organization: {
          id: org.id,
          name: 'Org Registrasi'
        }
      });

      // Duplikat WA ditolak
      const dupRes = await request(app).post('/api/v1/auth/register').send({
        waNumber: '081288887777',
        password: 'Password123!',
        fullName: 'Duplikat',
        inviteCode: 'REGTEST26'
      });
      expect(dupRes.status).toBe(400);

      // Login salah sandi ditolak 401
      const badLogin = await request(app).post('/api/v1/auth/login').send({
        waNumber: '081288887777',
        password: 'Salah'
      });
      expect(badLogin.status).toBe(401);

      // /me butuh token valid
      const unauthMe = await request(app).get('/api/v1/auth/me');
      expect(unauthMe.status).toBe(401);

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${regRes.body.token}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.passwordHash).toBeUndefined();

      // Ganti kata sandi lalu verifikasi login baru
      const pwdRes = await request(app)
        .put('/api/v1/auth/password')
        .set('Authorization', `Bearer ${regRes.body.token}`)
        .send({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' });
      expect(pwdRes.status).toBe(200);

      const newLogin = await request(app).post('/api/v1/auth/login').send({
        waNumber: '081288887777',
        password: 'NewPassword123!'
      });
      expect(newLogin.status).toBe(200);
    });

    it('POST /api/v1/auth/register menolak organisasi nonaktif atau undangan kedaluwarsa', async () => {
      await prisma.organization.create({
        data: {
          name: 'Org Mati',
          inviteCode: 'MATI2026',
          type: 'Komunitas',
          address: 'Jl. Z',
          contact: '081200000004',
          status: 'Nonaktif'
        }
      });

      const res = await request(app).post('/api/v1/auth/register').send({
        waNumber: '081277770000',
        password: 'Password123!',
        fullName: 'Gagal Uji',
        inviteCode: 'MATI2026'
      });
      expect(res.status).toBe(404);
    });
  });

  describe('Items Catalog & Creation', () => {
    it('POST /api/v1/items membuat kode ITM-001, GET /items mencari, dan GET /items/:id tampil', async () => {
      const org = await createOrg('Org Katalog', 'KATALOG26');
      const member = await createMember(org.id, {
        waNumber: '081255554444',
        fullName: 'Pemilik Alat'
      });

      const badSafe = await request(app)
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${member.token}`)
        .set('x-organization-id', org.id)
        .send({
          name: 'Bor Listrik',
          maxDays: 3,
          location: 'Gudang A',
          description: 'Bor impact 13mm',
          instructions: 'Pakai kacamata',
          isSafeAndReady: false
        });
      expect(badSafe.status).toBe(400);

      const badDays = await request(app)
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${member.token}`)
        .set('x-organization-id', org.id)
        .send({
          name: 'Bor Listrik',
          maxDays: 99,
          location: 'Gudang A',
          description: 'Bor impact 13mm',
          instructions: 'Pakai kacamata',
          isSafeAndReady: true
        });
      expect(badDays.status).toBe(400);

      const createRes = await request(app)
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${member.token}`)
        .set('x-organization-id', org.id)
        .send({
          name: 'Bor Listrik Impact',
          maxDays: 3,
          location: 'Gudang A',
          description: 'Bor impact 13mm',
          contents: ['1 unit bor', '1 kabel charger'],
          instructions: 'Pakai kacamata',
          isSafeAndReady: true
        });
      expect(createRes.status).toBe(201);
      expect(createRes.body.item.code).toBe('ITM-001');

      const searchRes = await request(app)
        .get('/api/v1/items?q=Impact')
        .set('Authorization', `Bearer ${member.token}`)
        .set('x-organization-id', org.id);
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.count).toBe(1);

      const detailRes = await request(app)
        .get(`/api/v1/items/${createRes.body.item.id}`)
        .set('Authorization', `Bearer ${member.token}`)
        .set('x-organization-id', org.id);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.item.name).toBe('Bor Listrik Impact');
    });
  });
});
