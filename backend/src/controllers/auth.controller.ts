import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { waNumber, password, fullName, address, inviteCode, documentType, documentUrl, documentName, documentNote } = req.body;

    if (!waNumber || !password || !fullName || !inviteCode) {
      res.status(400).json({ success: false, message: 'Mohon lengkapi seluruh field wajib pendaftaran.' });
      return;
    }

    const org = await prisma.organization.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() }
    });

    if (!org) {
      res.status(404).json({ success: false, message: 'Kode undangan organisasi tidak valid atau sudah kedaluwarsa.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { waNumber }
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'Nomor WhatsApp sudah terdaftar. Silakan masuk.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        waNumber,
        passwordHash,
        fullName,
        address: address || '',
        primaryOrgId: org.id,
        memberships: {
          create: {
            orgId: org.id,
            role: 'ANGGOTA',
            position: 'Anggota',
            status: 'MENUNGGU_VERIFIKASI',
            documentType: documentType || 'KTP',
            documentUrl: documentUrl || null,
            documentName: documentName || null,
            documentNote: documentNote || null,
            address: address || ''
          }
        }
      },
      include: {
        memberships: true
      }
    });

    const secret = process.env.JWT_SECRET || 'sarga_jwt_secret_dev';
    const token = jwt.sign({ id: user.id, waNumber: user.waNumber }, secret, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
    });

    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil. Akun Anda menunggu verifikasi pengurus.',
      token,
      user: {
        id: user.id,
        waNumber: user.waNumber,
        fullName: user.fullName,
        isPlatformAdmin: user.isPlatformAdmin,
        memberships: user.memberships
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { waNumber, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { waNumber },
      include: {
        memberships: {
          include: { organization: true }
        }
      }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Nomor WhatsApp atau kata sandi tidak cocok.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Nomor WhatsApp atau kata sandi tidak cocok.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'sarga_jwt_secret_dev';
    const token = jwt.sign({ id: user.id, waNumber: user.waNumber }, secret, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
    });

    res.json({
      success: true,
      message: 'Berhasil masuk.',
      token,
      user: {
        id: user.id,
        waNumber: user.waNumber,
        fullName: user.fullName,
        address: user.address,
        isPlatformAdmin: user.isPlatformAdmin,
        memberships: user.memberships
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        waNumber: true,
        fullName: true,
        address: true,
        isPlatformAdmin: true,
        memberships: {
          include: { organization: true }
        }
      }
    });

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkInviteCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    if (!code || !code.trim()) {
      res.status(400).json({ success: false, message: 'Kode undangan wajib diisi.' });
      return;
    }

    const org = await prisma.organization.findUnique({
      where: { inviteCode: code.trim().toUpperCase() },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        contact: true,
        status: true,
        inviteExpires: true,
        memberships: {
          where: { role: 'ADMIN', status: 'TERVERIFIKASI' },
          include: {
            user: { select: { fullName: true, waNumber: true } }
          },
          orderBy: { joinedAt: 'asc' },
          take: 5
        }
      }
    });

    if (!org || org.status !== 'Aktif') {
      res.status(404).json({ success: false, message: 'Kode undangan tidak ditemukan atau organisasi tidak aktif.' });
      return;
    }

    if (org.inviteExpires && new Date(org.inviteExpires) < new Date()) {
      res.status(400).json({ success: false, message: 'Kode undangan ini sudah kedaluwarsa.' });
      return;
    }

    const leaders = org.memberships.map((m) => ({
      position: m.position,
      user: m.user
    }));
    const ketua = leaders.find((l) => /ketua/i.test(l.position)) || leaders[0];
    const picName = ketua?.user.fullName || 'Pengurus Organisasi';
    const picContact = ketua?.user.waNumber || org.contact || 'Kontak Resmi Organisasi';
    const picPosition = ketua?.position || 'Pengurus Pertama';

    res.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        type: org.type,
        address: org.address,
        contact: org.contact
      },
      pic: {
        name: picName,
        contact: picContact,
        position: picPosition
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' });
      return;
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Kata sandi saat ini tidak cocok.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
