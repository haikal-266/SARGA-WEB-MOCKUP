import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { resolveUploadedDocumentUrl } from '../middlewares/upload.middleware';
import { HttpError } from '../utils/http-error';
import { respondError } from '../utils/respond-error';

const membershipInclude = {
  user: { select: { id: true, fullName: true, waNumber: true, address: true } }
} as const;

const findMembershipForOrg = (id: string, orgId: string) =>
  prisma.membership.findFirst({
    where: { id, orgId },
    include: membershipInclude
  });

const requestedId = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, 'ID keanggotaan wajib diisi.');
  }
  return value.trim();
};

const rejectionReason = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length < 5) {
    throw new HttpError(400, 'Alasan penolakan wajib diisi minimal 5 karakter.');
  }
  return value.trim();
};

export const listPendingMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { orgId: req.membership!.orgId, status: 'MENUNGGU_VERIFIKASI' },
      include: membershipInclude,
      orderBy: { joinedAt: 'asc' }
    });

    res.json({ success: true, count: memberships.length, memberships });
  } catch (error) {
    respondError(res, error);
  }
};

export const verifyMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.membership!.orgId;
    const id = requestedId(req.body?.membershipId);
    const membership = await findMembershipForOrg(id, orgId);

    if (!membership) {
      res.status(404).json({ success: false, message: 'Keanggotaan tidak ditemukan di organisasi ini.' });
      return;
    }

    if (membership.status !== 'MENUNGGU_VERIFIKASI') {
      res.status(409).json({ success: false, message: 'Keanggotaan ini sudah diverifikasi atau ditolak.' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      const update = await tx.membership.updateMany({
        where: { id, orgId, status: 'MENUNGGU_VERIFIKASI' },
        data: { status: 'TERVERIFIKASI', rejectionReason: null }
      });
      if (update.count === 0) throw new HttpError(409, 'Keanggotaan ini sudah diproses.');

      await tx.auditLog.create({
        data: {
          orgId,
          actorId: req.user!.id,
          action: 'Memverifikasi anggota',
          target: id
        }
      });
    });

    const updated = await findMembershipForOrg(id, orgId);
    res.json({ success: true, membership: updated, message: 'Anggota berhasil diverifikasi.' });
  } catch (error) {
    respondError(res, error);
  }
};

export const rejectMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.membership!.orgId;
    const id = requestedId(req.body?.membershipId);
    const reason = rejectionReason(req.body?.rejectionReason);
    const membership = await findMembershipForOrg(id, orgId);

    if (!membership) {
      res.status(404).json({ success: false, message: 'Keanggotaan tidak ditemukan di organisasi ini.' });
      return;
    }

    if (membership.status !== 'MENUNGGU_VERIFIKASI') {
      res.status(409).json({ success: false, message: 'Keanggotaan ini sudah diverifikasi atau ditolak.' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      const update = await tx.membership.updateMany({
        where: { id, orgId, status: 'MENUNGGU_VERIFIKASI' },
        data: { status: 'DITOLAK', rejectionReason: reason }
      });
      if (update.count === 0) throw new HttpError(409, 'Keanggotaan ini sudah diproses.');

      await tx.auditLog.create({
        data: {
          orgId,
          actorId: req.user!.id,
          action: 'Menolak anggota',
          target: id,
          note: reason
        }
      });
    });

    const updated = await findMembershipForOrg(id, orgId);
    res.json({ success: true, membership: updated, message: 'Pendaftaran anggota ditolak.' });
  } catch (error) {
    respondError(res, error);
  }
};

const requestedRole = (value: unknown): 'ADMIN' | 'ANGGOTA' => {
  if (value !== 'ADMIN' && value !== 'ANGGOTA') {
    throw new HttpError(400, 'Peran harus bernilai ADMIN atau ANGGOTA.');
  }
  return value;
};

const requestedPosition = (value: unknown): string => {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Jabatan wajib diisi.');
  }
  const position = value.trim();
  if (position.length === 0 || position.length > 50) {
    throw new HttpError(400, 'Jabatan wajib diisi dan maksimal 50 karakter.');
  }
  return position;
};

export const updateMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.membership!.orgId;
    const id = req.params.id;
    const role = requestedRole(req.body?.role);
    const position = requestedPosition(req.body?.position);
    const membership = await findMembershipForOrg(id, orgId);

    if (!membership) {
      res.status(404).json({ success: false, message: 'Keanggotaan tidak ditemukan di organisasi ini.' });
      return;
    }

    const demotesAdmin =
      membership.role === 'ADMIN' &&
      membership.status === 'TERVERIFIKASI' &&
      role === 'ANGGOTA';

    await prisma.$transaction(async (tx) => {
      await tx.membership.update({ where: { id, orgId }, data: { role, position } });

      if (demotesAdmin) {
        const adminCount = await tx.membership.count({
          where: { orgId, role: 'ADMIN', status: 'TERVERIFIKASI' }
        });
        if (adminCount === 0) {
          throw new HttpError(409, 'Organisasi harus memiliki minimal satu pengurus terverifikasi.');
        }
      }

      await tx.auditLog.create({
        data: {
          orgId,
          actorId: req.user!.id,
          action: 'Mengubah peran anggota',
          target: id,
          note: `Peran ${role}, jabatan ${position}.`
        }
      });
    });

    const updated = await findMembershipForOrg(id, orgId);
    res.json({ success: true, membership: updated, message: 'Data keanggotaan diperbarui.' });
  } catch (error) {
    respondError(res, error);
  }
};

export const resubmitMembership = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id;
    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        organization: true,
        user: { select: { id: true, fullName: true, waNumber: true, address: true } }
      }
    });

    if (!membership || membership.userId !== userId) {
      res.status(404).json({ success: false, message: 'Keanggotaan tidak ditemukan.' });
      return;
    }

    if (membership.status !== 'DITOLAK') {
      res.status(409).json({
        success: false,
        message: 'Hanya pendaftaran yang ditolak yang dapat didaftarkan ulang.'
      });
      return;
    }

    if (!membership.organization || membership.organization.status !== 'Aktif') {
      res.status(404).json({ success: false, message: 'Organisasi tidak aktif atau tidak ditemukan.' });
      return;
    }

    const uploadedUrl = await resolveUploadedDocumentUrl(
      membership.orgId,
      req.file,
      req.body?.documentUrl
    );
    const nextDocumentUrl = uploadedUrl ?? membership.documentUrl;
    if (!nextDocumentUrl) {
      res.status(400).json({
        success: false,
        message: 'Unggah foto dokumen identitas sebelum mendaftar ulang.'
      });
      return;
    }

    const nextFullName =
      typeof req.body?.fullName === 'string' && req.body.fullName.trim().length >= 2
        ? req.body.fullName.trim()
        : undefined;
    const nextAddress =
      typeof req.body?.address === 'string' && req.body.address.trim()
        ? req.body.address.trim()
        : membership.address;
    const nextDocType =
      typeof req.body?.documentType === 'string' && req.body.documentType.trim()
        ? req.body.documentType.trim()
        : membership.documentType || 'KTP';
    const nextDocName =
      (typeof req.body?.documentName === 'string' && req.body.documentName.trim()) ||
      req.file?.originalname ||
      membership.documentName ||
      null;
    const nextDocNote =
      typeof req.body?.documentNote === 'string'
        ? req.body.documentNote.trim() || null
        : membership.documentNote;

    await prisma.$transaction(async (tx) => {
      const update = await tx.membership.updateMany({
        where: { id, userId, status: 'DITOLAK' },
        data: {
          status: 'MENUNGGU_VERIFIKASI',
          rejectionReason: null,
          documentType: nextDocType,
          documentUrl: nextDocumentUrl,
          documentName: nextDocName,
          documentNote: nextDocNote,
          address: nextAddress,
          joinedAt: new Date()
        }
      });
      if (update.count === 0) {
        throw new HttpError(409, 'Status keanggotaan sudah berubah.');
      }

      if (nextFullName) {
        await tx.user.update({ where: { id: userId }, data: { fullName: nextFullName } });
      }

      await tx.auditLog.create({
        data: {
          orgId: membership.orgId,
          actorId: userId,
          action: 'Mendaftar ulang keanggotaan',
          target: id
        }
      });
    });

    const updated = await prisma.membership.findUnique({
      where: { id },
      include: {
        organization: true,
        user: { select: { id: true, fullName: true, waNumber: true, address: true } }
      }
    });
    res.json({
      success: true,
      membership: updated,
      message: 'Pendaftaran ulang berhasil dikirim. Akun Anda menunggu verifikasi pengurus.'
    });
  } catch (error) {
    respondError(res, error);
  }
};
