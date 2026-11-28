import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import sharp from 'sharp';
import app from '../src/app';
import prisma from '../src/config/database';
import { createMember, createOrg, resetDb } from './helpers';

describe('BE-SKI-14: pusat verifikasi calon anggota', () => {
  let orgA: { id: string };
  let admin: { user: { id: string }; token: string };
  let member: { user: { id: string }; token: string };
  const uploadedOrgIds: string[] = [];

  afterEach(() => {
    for (const orgId of new Set(uploadedOrgIds)) {
      fs.rmSync(path.resolve(process.cwd(), 'uploads', orgId), { recursive: true, force: true });
    }
    uploadedOrgIds.length = 0;
  });

  const auth = (token: string, orgId: string) => ({
    Authorization: `Bearer ${token}`,
    'x-organization-id': orgId
  });
  const pending = async (waNumber: string, fullName: string) =>
    createMember(orgA.id, {
      waNumber,
      fullName,
      status: 'MENUNGGU_VERIFIKASI',
      documentType: 'KTP',
      documentUrl: '/uploads/documents/contoh.jpg',
      documentName: 'contoh.jpg',
      documentNote: 'Lampiran pendaftaran'
    });

  beforeEach(async () => {
    await resetDb();
    orgA = await createOrg('Organisasi Verifikasi', 'ORGVERIFIKASI2026');
    admin = await createMember(orgA.id, {
      waNumber: '081200000061',
      fullName: 'Pengurus Verifikasi',
      role: 'ADMIN'
    });
    member = await createMember(orgA.id, { waNumber: '081200000062', fullName: 'Anggota Biasa' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('admin melihat calon anggota beserta dokumen', async () => {
    await pending('081200000063', 'Calon Anggota Satu');

    const res = await request(app).get('/api/v1/memberships/pending').set(auth(admin.token, orgA.id));

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.memberships[0].documentUrl).toBe('/uploads/documents/contoh.jpg');
    expect(res.body.memberships[0].user.fullName).toBe('Calon Anggota Satu');
  });

  it('daftar pending hanya untuk organisasi aktif', async () => {
    const orgB = await createOrg('Organisasi Lain Verifikasi', 'ORGLAINVERIFIKASI2026');
    await createMember(orgB.id, {
      waNumber: '081200000064',
      fullName: 'Calon Org B',
      status: 'MENUNGGU_VERIFIKASI',
      documentUrl: '/uploads/documents/b.jpg'
    });

    const res = await request(app).get('/api/v1/memberships/pending').set(auth(admin.token, orgA.id));

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('admin memverifikasi anggota', async () => {
    const target = await pending('081200000065', 'Calon Anggota Dua');

    const res = await request(app)
      .patch('/api/v1/memberships/verify')
      .set(auth(admin.token, orgA.id))
      .send({ membershipId: target.membership.id });

    expect(res.status).toBe(200);
    expect(res.body.membership.status).toBe('TERVERIFIKASI');
    expect(res.body.membership.rejectionReason).toBeNull();
  });

  it('admin menolak anggota dengan alasan tertulis', async () => {
    const target = await pending('081200000066', 'Calon Anggota Tiga');

    const res = await request(app)
      .patch('/api/v1/memberships/reject')
      .set(auth(admin.token, orgA.id))
      .send({ membershipId: target.membership.id, rejectionReason: 'Dokumen tidak terbaca dengan jelas.' });

    expect(res.status).toBe(200);
    expect(res.body.membership.status).toBe('DITOLAK');
    expect(res.body.membership.rejectionReason).toContain('Dokumen tidak terbaca');
  });

  it('alasan penolakan anggota minimal 5 karakter', async () => {
    const target = await pending('081200000067', 'Calon Anggota Empat');

    const res = await request(app)
      .patch('/api/v1/memberships/reject')
      .set(auth(admin.token, orgA.id))
      .send({ membershipId: target.membership.id, rejectionReason: 'tid' });

    expect(res.status).toBe(400);
  });

  it('target dari organisasi lain tidak ditemukan', async () => {
    const orgB = await createOrg('Organisasi Lain Target', 'ORGLAINTARGET2026');
    const targetB = await createMember(orgB.id, {
      waNumber: '081200000068',
      fullName: 'Calon Org B',
      status: 'MENUNGGU_VERIFIKASI'
    });

    const res = await request(app)
      .patch('/api/v1/memberships/verify')
      .set(auth(admin.token, orgA.id))
      .send({ membershipId: targetB.membership.id });

    expect(res.status).toBe(404);
  });

  it('anggota biasa ditolak', async () => {
    const target = await pending('081200000069', 'Calon Anggota Lima');

    const list = await request(app).get('/api/v1/memberships/pending').set(auth(member.token, orgA.id));
    const verify = await request(app)
      .patch('/api/v1/memberships/verify')
      .set(auth(member.token, orgA.id))
      .send({ membershipId: target.membership.id });

    expect(list.status).toBe(403);
    expect(verify.status).toBe(403);
  });

  it('verifikasi ulang anggota sudah terverifikasi ditolak', async () => {
    const res = await request(app)
      .patch('/api/v1/memberships/verify')
      .set(auth(admin.token, orgA.id))
      .send({ membershipId: member.membership.id });

    expect(res.status).toBe(409);
  });

  it('membershipId wajib diisi', async () => {
    const res = await request(app)
      .patch('/api/v1/memberships/verify')
      .set(auth(admin.token, orgA.id))
      .send({});

    expect(res.status).toBe(400);
  });

  it('mencatat audit verifikasi dan penolakan', async () => {
    const targetA = await pending('081200000070', 'Calon Anggota Enam');
    const targetB = await pending('081200000071', 'Calon Anggota Tujuh');
    await request(app)
      .patch('/api/v1/memberships/verify')
      .set(auth(admin.token, orgA.id))
      .send({ membershipId: targetA.membership.id });
    await request(app)
      .patch('/api/v1/memberships/reject')
      .set(auth(admin.token, orgA.id))
      .send({ membershipId: targetB.membership.id, rejectionReason: 'Data tidak lengkap.' });

    const audits = await prisma.auditLog.findMany({ where: { orgId: orgA.id }, orderBy: { createdAt: 'asc' } });
    expect(audits.map((a) => a.action)).toEqual(['Memverifikasi anggota', 'Menolak anggota']);
    expect(audits[0].actorId).toBe(admin.user.id);
  });

  it('pendaftar yang ditolak dapat mendaftar ulang dengan foto baru dan kembali menunggu verifikasi', async () => {
    uploadedOrgIds.push(orgA.id);
    const target = await createMember(orgA.id, {
      waNumber: '081200000072',
      fullName: 'Calon Ditolak',
      status: 'MENUNGGU_VERIFIKASI'
    });

    await request(app)
      .patch('/api/v1/memberships/reject')
      .set(auth(admin.token, orgA.id))
      .send({ membershipId: target.membership.id, rejectionReason: 'upload foto dlu' });

    // Tanpa dokumen foto saat sebelumnya null harus ditolak 400
    const missingDocRes = await request(app)
      .post(`/api/v1/memberships/${target.membership.id}/resubmit`)
      .set('Authorization', `Bearer ${target.token}`)
      .field('address', 'Blok H2/18');
    expect(missingDocRes.status).toBe(400);

    // Anggota lain tidak bisa mendaftar ulang milik orang lain
    const otherRes = await request(app)
      .post(`/api/v1/memberships/${target.membership.id}/resubmit`)
      .set('Authorization', `Bearer ${member.token}`)
      .field('address', 'Blok Lain');
    expect(otherRes.status).toBe(404);

    // Daftar ulang dengan file foto nyata berhasil
    const pngBuf = await sharp({
      create: { width: 320, height: 200, channels: 3, background: '#0f172a' }
    })
      .png()
      .toBuffer();

    const resubmitRes = await request(app)
      .post(`/api/v1/memberships/${target.membership.id}/resubmit`)
      .set('Authorization', `Bearer ${target.token}`)
      .field('fullName', 'Calon Ditolak Diperbaiki')
      .field('address', 'Purcil Blok H2/18')
      .field('documentType', 'KTP')
      .field('documentName', 'ktp_baru.jpg')
      .attach('document', pngBuf, { filename: 'ktp_baru.jpg', contentType: 'image/png' });

    expect(resubmitRes.status).toBe(200);
    expect(resubmitRes.body.success).toBe(true);
    expect(resubmitRes.body.membership.status).toBe('MENUNGGU_VERIFIKASI');
    expect(resubmitRes.body.membership.rejectionReason).toBeNull();
    expect(resubmitRes.body.membership.documentUrl).toMatch(new RegExp(`^/uploads/${orgA.id}/.+\\.jpg$`));

    const pendingRes = await request(app).get('/api/v1/memberships/pending').set(auth(admin.token, orgA.id));
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.count).toBe(1);
    expect(pendingRes.body.memberships[0].user.fullName).toBe('Calon Ditolak Diperbaiki');
    expect(pendingRes.body.memberships[0].documentUrl).toBe(resubmitRes.body.membership.documentUrl);
  });
});
