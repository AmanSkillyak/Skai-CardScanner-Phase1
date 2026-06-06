import { Router } from 'express';
import upload from '../middleware/upload';
import { createScan, getScanStatus, getScanResult } from '../controllers/scan.controller';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();
router.post('/', rateLimit, upload.single('file'), createScan);
router.get('/:id/status', getScanStatus);
router.get('/:id/result', getScanResult);
export default router;
