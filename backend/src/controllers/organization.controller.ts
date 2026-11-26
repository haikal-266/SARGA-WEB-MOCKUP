import { Response } from 'express';
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
      select: { id: true, name: true, type: true, address: true, contact: true, inviteCode: true, inviteExpires: true }
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
