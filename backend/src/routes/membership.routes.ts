import { Router } from 'express';
import {
  listPendingMembers,
  rejectMember,
  resubmitMembership,
  updateMember,
  verifyMember
} from '../controllers/membership.controller';
import { authenticateToken, requireActiveMember, requireAdmin } from '../middlewares/auth.middleware';
import { uploadOptionalDocument } from '../middlewares/upload.middleware';

const router = Router();

router.post('/:id/resubmit', authenticateToken, uploadOptionalDocument, resubmitMembership);

router.use(authenticateToken, requireActiveMember, requireAdmin);

router.get('/pending', listPendingMembers);
router.patch('/verify', verifyMember);
router.patch('/reject', rejectMember);
router.put('/:id', updateMember);

export default router;
