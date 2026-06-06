import { Router } from 'express';
import { exportContacts } from '../controllers/export.controller';
import { rateLimit } from '../middleware/rateLimit';
import { validateExportBody } from '../middleware/validation';

const router = Router();
router.post('/', rateLimit, validateExportBody, exportContacts);
export default router;
