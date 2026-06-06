import { Router } from 'express';
import { getCategories, suggestCategory } from '../controllers/category.controller';
import { validateCategorySuggestBody } from '../middleware/validation';

const router = Router();
router.get('/', getCategories);
router.post('/suggest', validateCategorySuggestBody, suggestCategory);
export default router;
