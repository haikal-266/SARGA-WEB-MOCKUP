import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { respondError } from '../utils/respond-error';
import { generateRandomInviteCode } from './organization.controller';

const VALID_ORG_TYPES = ['RT/RW', 'Komunitas', 'Kantor', 'Sekolah', 'Lainnya'];

export const getPlatformOrganizations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, status } = req.query;

    const where: any = {};

    if (status && typeof status === 'string' && ['Aktif', 'Nonaktif'].includes(status)) {
      where.status = status;
    }

    if (q && typeof q === 'string' && q.trim()) {
      const keyword = q.trim();
      where.OR = [
        { name: { contains: keyword } },
        { type: { contains: keyword } },
        { address: { contains: keyword } },
        { contact: { contains: keyword } },
        { inviteCode: { contains: keyword } }
      ];
    }

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        _count: {
          select: {
            memberships: true,
            items: true,
            loans: true
          }
        },
        memberships: {
          where: { role: 'ADMIN' },
          include: {
            user: {
              select: { id: true, fullName: true, waNumber: true }
            }
          },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      total: organizations.length,
      organizations
    });
  } catch (error) {
    respondError(res, error);
  }
};

export const getPlatformOrganizationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            memberships: true,
            items: true,
            loans: true
          }
        },
        memberships: {
          include: {
            user: {
              select: { id: true, fullName: true, waNumber: true, address: true }
            }
          }
        }
      }
    });

    if (!organization) {
      res.status(404).json({ success: false, message: 'Organisasi tidak ditemukan.' });
      return;
    }

    res.json({
      success: true,
      organization
    });
  } catch (error) {
    respondError(res, error);
  }
};

export const createPlatformOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, address, contact, inviteCode, firstAdminId, firstAdminPosition } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 100) {
      res.status(400).json({ success: false, message: 'Nama organisasi wajib diisi (3-100 karakter).' });
      return;
    }

    const orgType = type || 'Komunitas';
    if (!VALID_ORG_TYPES.includes(orgType)) {
      res.status(400).json({ success: false, message: `Jenis organisasi tidak valid. Pilihan: ${VALID_ORG_TYPES.join(', ')}.` });
      return;
    }

    if (!address || typeof address !== 'string' || address.trim().length < 3 || address.trim().length > 255) {
      res.status(400).json({ success: false, message: 'Alamat organisasi wajib diisi (3-255 karakter).' });
      return;
    }

    if (!contact || typeof contact !== 'string' || contact.trim().length < 5 || contact.trim().length > 50) {
      res.status(400).json({ success: false, message: 'Kontak organisasi wajib diisi (5-50 karakter).' });
      return;
    }

    let finalInviteCode: string;
    if (inviteCode) {
      if (typeof inviteCode !== 'string' || inviteCode.trim().length < 3 || inviteCode.trim().length > 20) {
        res.status(400).json({ success: false, message: 'Kode undangan harus terdiri dari 3 hingga 20 karakter.' });
        return;
      }
      finalInviteCode = inviteCode.trim().toUpperCase();
      const existing = await prisma.organization.findUnique({ where: { inviteCode: finalInviteCode } });
      if (existing) {
        res.status(409).json({ success: false, message: 'Kode undangan sudah digunakan oleh organisasi lain.' });
        return;
      }
    } else {
      let unique = false;
      let attempts = 0;
      finalInviteCode = generateRandomInviteCode();
      while (!unique && attempts < 10) {
        const existing = await prisma.organization.findUnique({ where: { inviteCode: finalInviteCode } });
        if (!existing) {
          unique = true;
        } else {
          finalInviteCode = generateRandomInviteCode();
          attempts++;
        }
      }
    }

    const targetAdminUserId = firstAdminId ? String(firstAdminId).trim() : req.user!.id;
    const adminUser = await prisma.user.findUnique({ where: { id: targetAdminUserId } });
    if (!adminUser) {
      res.status(404).json({ success: false, message: 'Pengguna penanggung jawab / pengurus pertama tidak ditemukan.' });
      return;
    }

    const adminPosition = firstAdminPosition && typeof firstAdminPosition === 'string' && firstAdminPosition.trim()
      ? firstAdminPosition.trim()
      : 'Ketua / Pengurus Pertama';

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: name.trim(),
          type: orgType,
          address: address.trim(),
          contact: contact.trim(),
          inviteCode: finalInviteCode,
          status: 'Aktif'
        }
      });

      const membership = await tx.membership.create({
        data: {
          userId: targetAdminUserId,
          orgId: organization.id,
          role: 'ADMIN',
          position: adminPosition,
          status: 'TERVERIFIKASI'
        },
        include: {
          user: {
            select: { id: true, fullName: true, waNumber: true }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          orgId: organization.id,
          actorId: req.user!.id,
          action: 'Membuat organisasi',
          target: organization.id,
          note: `Organisasi ${organization.name} dibuat oleh platform admin ${req.user!.fullName}. Pengurus pertama: ${adminUser.fullName} (${adminPosition}).`
        }
      });

      return { organization, membership };
    });

    res.status(201).json({
      success: true,
      message: 'Organisasi baru berhasil didaftarkan.',
      organization: result.organization,
      membership: result.membership
    });
  } catch (error) {
    respondError(res, error);
  }
};
