import { Router } from 'express';
import {
  getOrganizationStructure,
  getOrganizationById,
  updateOrganization,
  regenerateInviteCode,
  updateOrganizationStatus
} from '../controllers/organization.controller';
import { authenticateToken, requireActiveMember, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken, requireActiveMember);

router.get('/:id/structure', getOrganizationStructure);
router.get('/:id', getOrganizationById);
router.put('/:id', requireAdmin, updateOrganization);
router.post('/:id/regenerate-invite', requireAdmin, regenerateInviteCode);
router.patch('/:id/status', requireAdmin, updateOrganizationStatus);

export default router;
