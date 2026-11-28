import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getCatalog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.membership?.orgId;
    const search = (req.query.q as string)?.trim().toLowerCase();

    if (!orgId) {
      res.status(400).json({ success: false, message: 'ID organisasi diperlukan untuk menampilkan katalog.' });
      return;
    }

    const items = await prisma.item.findMany({
      where: {
        orgId,
        status: { not: 'DIARSIPKAN' },
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { description: { contains: search } },
                { code: { contains: search } }
              ]
            }
          : {})
      },
      include: {
        owner: {
          select: { id: true, fullName: true, waNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: items.length, items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getItemById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await prisma.item.findFirst({
      where: { id, orgId: req.membership!.orgId },
      include: {
        owner: { select: { id: true, fullName: true, waNumber: true, address: true } },
        organization: { select: { id: true, name: true } },
        loans: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { borrower: { select: { id: true, fullName: true } } }
        }
      }
    });

    if (!item) {
      res.status(404).json({ success: false, message: 'Barang tidak ditemukan.' });
      return;
    }

    res.json({ success: true, item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, maxDays, location, description, contents, instructions, image, isSafeAndReady } = req.body;
    const orgId = req.membership!.orgId;
    const userId = req.user?.id;

    if (!name || !maxDays || !location || !description || !instructions) {
      res.status(400).json({ success: false, message: 'Mohon isi seluruh field wajib barang.' });
      return;
    }

    if (!isSafeAndReady) {
      res.status(400).json({ success: false, message: 'Wajib mencentang pernyataan bahwa barang aman dan layak pakai.' });
      return;
    }

    const parsedMaxDays = Number(maxDays);
    if (!Number.isInteger(parsedMaxDays) || parsedMaxDays < 1 || parsedMaxDays > 14) {
      res.status(400).json({ success: false, message: 'Maksimal masa pinjam harus bilangan bulat 1 hingga 14 hari.' });
      return;
    }

    // Auto-generate code ITM-xxx
    const count = await prisma.item.count({ where: { orgId } });
    const code = `ITM-${String(count + 1).padStart(3, '0')}`;

    const item = await prisma.item.create({
      data: {
        code,
        orgId,
        ownerId: userId,
        name,
        maxDays: Number(maxDays),
        location,
        status: 'TERSEDIA',
        description,
        contents: typeof contents === 'string' ? contents : JSON.stringify(contents || []),
        instructions,
        image: image || 'assets/placeholder-item.svg',
        isSafeAndReady: true
      }
    });

    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId!,
        action: 'Menambahkan barang',
        target: name,
        note: `Barang ${code} tayang di katalog.`
      }
    });

    res.status(201).json({ success: true, message: 'Barang berhasil ditayangkan di katalog.', item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
