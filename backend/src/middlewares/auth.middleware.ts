import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    waNumber: string;
    fullName: string;
    isPlatformAdmin?: boolean;
  };
  membership?: {
    orgId: string;
    role: 'ANGGOTA' | 'ADMIN';
    status: 'MENUNGGU_VERIFIKASI' | 'TERVERIFIKASI' | 'DITOLAK';
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Akses ditolak: token autentikasi tidak ditemukan.'
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'sarga_jwt_secret_dev';
    const payload = jwt.verify(token, secret) as { id: string; waNumber: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, waNumber: true, fullName: true, isPlatformAdmin: true }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    req.user = user;

    // Optional: check active org from header
    const orgId = req.headers['x-organization-id'] as string;
    if (orgId) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_orgId: {
            userId: user.id,
            orgId
          }
        }
      });
      if (membership) {
        req.membership = {
          orgId: membership.orgId,
          role: membership.role as any,
          status: membership.status as any
        };
      }
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Token tidak valid atau sudah kedaluwarsa.'
    });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.membership || req.membership.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak: hanya pengurus/admin organisasi yang memiliki izin.'
    });
    return;
  }
  next();
};

export const requireActiveMember = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.membership || req.membership.status !== 'TERVERIFIKASI') {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak: keanggotaan Anda belum diverifikasi oleh pengurus.'
    });
    return;
  }
  next();
};

export const requirePlatformAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.isPlatformAdmin) {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak: hanya admin platform yang memiliki izin.'
    });
    return;
  }
  next();
};
