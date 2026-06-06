import { Router } from 'express';
import { saveContact, getContacts, getContact, updateContact, deleteContact } from '../controllers/contact.controller';
import { validateContactBody } from '../middleware/validation';

const router = Router();
router.post('/', validateContactBody, saveContact);
router.get('/', getContacts);
router.get('/:id', getContact);
router.put('/:id', validateContactBody, updateContact);
router.delete('/:id', deleteContact);
export default router;
