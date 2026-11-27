import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { respondError } from '../utils/respond-error';

type StructureMemberView = {
  id: string;
  userId: string;
  fullName: string;
  waNumber: string;
  position: string;
  division: string | null;
  role: 'ADMIN' | 'ANGGOTA';
  joinedAt: string;
};

const positionRank = (position: string): number => {
  if (/ketua/i.test(position)) return 0;
  if (/sekretaris/i.test(position)) return 1;
  if (/bendahara/i.test(position)) return 2;
  return 99;
};

const divisionFromPosition = (position: string): string | null => {
  const match = position.match(/\b(divisi|unit|bagian|bidang|seksi|ruang)\b[\s-]*\S.*$/i);
  return match ? match[0].trim() : null;
};

const compareMembers = (a: StructureMemberView, b: StructureMemberView): number => {
  const rank = positionRank(a.position) - positionRank(b.position);
  if (rank !== 0) return rank;
  const joined = a.joinedAt.localeCompare(b.joinedAt);
  if (joined !== 0) return joined;
  return a.id.localeCompare(b.id);
};

export const generateRandomInviteCode = (prefix = 'SRG'): string => {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
};

export const getOrganizationStructure = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.membership!.orgId;
    if (req.params.id !== orgId) {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak: organisasi tidak sesuai dengan konteks aktif.'
      });
      return;
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, type: true, address: true, contact: true }
    });
    if (!organization) {
      res.status(404).json({ success: false, message: 'Organisasi tidak ditemukan.' });
      return;
    }

    const memberships = await prisma.membership.findMany({
      where: { orgId, status: 'TERVERIFIKASI' },
      include: { user: { select: { id: true, fullName: true, waNumber: true } } }
    });

    const people: StructureMemberView[] = memberships.map((membership) => ({
      id: membership.id,
      userId: membership.user.id,
      fullName: membership.user.fullName,
      waNumber: membership.user.waNumber,
      position: membership.position,
      division: divisionFromPosition(membership.position),
      role: membership.role,
      joinedAt: membership.joinedAt.toISOString()
    }));
    people.sort(compareMembers);

    res.json({
      success: true,
      organization,
      leaders: people.filter((person) => person.role === 'ADMIN'),
      members: people.filter((person) => person.role !== 'ADMIN')
    });
  } catch (error) {
    respondError(res, error);
  }
};

export const getOrganizationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.membership!.orgId;
    if (req.params.id !== orgId) {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak: organisasi tidak sesuai dengan konteks aktif.'
      });
      return;
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            memberships: { where: { status: 'TERVERIFIKASI' } },
            items: true,
            loans: true
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

export const updateOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.membership!.orgId;
    if (req.params.id !== orgId) {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak: organisasi tidak sesuai dengan konteks aktif.'
      });
      return;
    }

    const { name, type, address, contact, inviteExpires } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 100) {
        res.status(400).json({ success: false, message: 'Nama organisasi harus antara 3 hingga 100 karakter.' });
        return;
      }
    }
    if (type !== undefined) {
      const validTypes = ['RT/RW', 'Komunitas', 'Kantor', 'Sekolah', 'Lainnya'];
      if (!validTypes.includes(type)) {
        res.status(400).json({ success: false, message: `Jenis organisasi tidak valid. Pilihan: ${validTypes.join(', ')}.` });
        return;
      }
    }
    if (address !== undefined) {
      if (typeof address !== 'string' || address.trim().length < 3 || address.trim().length > 255) {
        res.status(400).json({ success: false, message: 'Alamat organisasi harus antara 3 hingga 255 karakter.' });
        return;
      }
    }
    if (contact !== undefined) {
      if (typeof contact !== 'string' || contact.trim().length < 5 || contact.trim().length > 50) {
        res.status(400).json({ success: false, message: 'Kontak organisasi harus antara 5 hingga 50 karakter.' });
        return;
      }
    }

    let parsedExpires: Date | null | undefined = undefined;
    if (inviteExpires !== undefined) {
      if (inviteExpires === null || inviteExpires === '') {
        parsedExpires = null;
      } else {
        const parsed = new Date(inviteExpires);
        if (isNaN(parsed.getTime())) {
          res.status(400).json({ success: false, message: 'Format tanggal kedaluwarsa undangan tidak valid.' });
          return;
        }
        parsedExpires = parsed;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id: orgId },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(address !== undefined ? { address: address.trim() } : {}),
          ...(contact !== undefined ? { contact: contact.trim() } : {}),
          ...(parsedExpires !== undefined ? { inviteExpires: parsedExpires } : {})
        }
      });

      await tx.auditLog.create({
        data: {
          orgId,
          actorId: req.user!.id,
          action: 'Mengubah profil organisasi',
          target: orgId,
          note: `Profil organisasi diperbarui oleh ${req.user!.fullName}.`
        }
      });

      return org;
    });

    res.json({
      success: true,
      message: 'Profil organisasi berhasil diperbarui.',
      organization: updated
    });
  } catch (error) {
    respondError(res, error);
  }
};

export const regenerateInviteCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.membership!.orgId;
    if (req.params.id !== orgId) {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak: organisasi tidak sesuai dengan konteks aktif.'
      });
      return;
    }

    const customCode = req.body?.inviteCode;
    let newCode: string;

    if (customCode) {
      if (typeof customCode !== 'string' || customCode.trim().length < 3 || customCode.trim().length > 20) {
        res.status(400).json({ success: false, message: 'Kode undangan harus terdiri dari 3 hingga 20 karakter.' });
        return;
      }
      newCode = customCode.trim().toUpperCase();
      const existing = await prisma.organization.findUnique({ where: { inviteCode: newCode } });
      if (existing && existing.id !== orgId) {
        res.status(409).json({ success: false, message: 'Kode undangan sudah digunakan oleh organisasi lain.' });
        return;
      }
    } else {
      let unique = false;
      let attempts = 0;
      newCode = generateRandomInviteCode();
      while (!unique && attempts < 10) {
        const existing = await prisma.organization.findUnique({ where: { inviteCode: newCode } });
        if (!existing) {
          unique = true;
        } else {
          newCode = generateRandomInviteCode();
          attempts++;
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id: orgId },
        data: { inviteCode: newCode }
      });

      await tx.auditLog.create({
        data: {
          orgId,
          actorId: req.user!.id,
          action: 'Mengganti kode undangan',
          target: orgId,
          note: `Kode undangan baru diacak: ${newCode}`
        }
      });

      return org;
    });

    res.json({
      success: true,
      message: 'Kode undangan berhasil diperbarui.',
      inviteCode: updated.inviteCode,
      organization: updated
    });
  } catch (error) {
    respondError(res, error);
  }
};

export const updateOrganizationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.membership!.orgId;
    if (req.params.id !== orgId) {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak: organisasi tidak sesuai dengan konteks aktif.'
      });
      return;
    }

    const { status } = req.body;
    if (!status || !['Aktif', 'Nonaktif'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status organisasi tidak valid. Harus "Aktif" atau "Nonaktif".'
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id: orgId },
        data: { status }
      });

      await tx.auditLog.create({
        data: {
          orgId,
          actorId: req.user!.id,
          action: 'Mengubah status organisasi',
          target: orgId,
          note: `Status organisasi diubah menjadi ${status}.`
        }
      });

      return org;
    });

    res.json({
      success: true,
      message: 'Status organisasi berhasil diperbarui.',
      organization: updated
    });
  } catch (error) {
    respondError(res, error);
  }
};
