import { Router } from 'express';
import {
  getPlatformOrganizations,
  getPlatformOrganizationById,
  createPlatformOrganization
} from '../controllers/platform.controller';
import { authenticateToken, requirePlatformAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken, requirePlatformAdmin);

router.get('/organizations', getPlatformOrganizations);
router.get('/organizations/:id', getPlatformOrganizationById);
router.post('/organizations', createPlatformOrganization);

export default router;
