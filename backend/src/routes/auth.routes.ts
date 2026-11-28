import { Router } from 'express';
import { register, login, getMe, changePassword, checkInviteCode } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { uploadOptionalDocument } from '../middlewares/upload.middleware';

const router = Router();

router.post('/register', uploadOptionalDocument, register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/password', authenticateToken, changePassword);
router.get('/invite/:code', checkInviteCode);

export default router;
