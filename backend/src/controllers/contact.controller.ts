import { Request, Response } from 'express';
import Contact from '../models/Contact';
import { ContactFilter, ContactSearchCondition, ContactWritePayload } from '../types';
import { errorResponse } from '../utils/apiError';

const queryString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.find((item): item is string => typeof item === 'string');
  return undefined;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PHONE_SEPARATOR_PATTERN = '[\\s\\-().]*';

const phoneDigitsPattern = (digits: string): string =>
  digits.split('').map(digit => `${escapeRegExp(digit)}${PHONE_SEPARATOR_PATTERN}`).join('');

const phoneSearchRegex = (search: string): RegExp | undefined => {
  const digits = search.replace(/\D/g, '');
  if (digits.length < 3) return undefined;

  const patterns = new Set<string>();
  patterns.add(phoneDigitsPattern(digits));

  if (digits.length === 10) {
    patterns.add(`(?:\\+?91${PHONE_SEPARATOR_PATTERN})?${phoneDigitsPattern(digits)}`);
  }

  if (digits.length > 10 && digits.startsWith('91')) {
    patterns.add(phoneDigitsPattern(digits.slice(-10)));
  }

  return new RegExp([...patterns].join('|'), 'i');
};

export const buildContactFilter = (search?: string, category?: string): ContactFilter => {
  const filter: ContactFilter = {};
  const trimmedCategory = category?.trim();
  const trimmedSearch = search?.trim();

  if (trimmedCategory) filter.category = trimmedCategory;

  if (!trimmedSearch) return filter;

  const textRe = new RegExp(escapeRegExp(trimmedSearch), 'i');
  const searchConditions: ContactSearchCondition[] = [
    { person_name: textRe },
    { company_name: textRe },
    { designation: textRe },
    { website: textRe },
    { emails: textRe },
    { phones: textRe },
    { 'address.raw': textRe },
    { category: textRe },
    { 'category.suggested_category': textRe },
  ];

  const phoneRe = phoneSearchRegex(trimmedSearch);
  if (phoneRe) searchConditions.push({ phones: phoneRe });

  filter.$or = searchConditions;
  return filter;
};

// POST /api/contacts
export const saveContact = async (req: Request<unknown, unknown, ContactWritePayload>, res: Response): Promise<void> => {
  const { person_name, emails = [], phones = [] } = req.body;
  if (!person_name) { res.status(400).json(errorResponse('VALIDATION_ERROR', 'person_name is required')); return; }

  // Duplicate check
  if (emails.length || phones.length) {
    const orQuery: object[] = [];
    if (emails.length) orQuery.push({ emails: { $in: emails } });
    if (phones.length) orQuery.push({ phones: { $in: phones } });
    const exists = await Contact.findOne({ $or: orQuery });
    if (exists) { res.status(409).json(errorResponse('CONFLICT', 'Duplicate contact', { id: exists._id })); return; }
  }

  const contact = await Contact.create(req.body);
  res.status(201).json({ success: true, contact });
};

// GET /api/contacts
export const getContacts = async (req: Request, res: Response): Promise<void> => {
  const search = queryString(req.query.search) || queryString(req.query.query);
  const category = queryString(req.query.category);
  const filter = buildContactFilter(search, category);
  const contacts = await Contact.find(filter).sort({ createdAt: -1 }).select('-raw_ocr_text');
  res.json(contacts);
};

// GET /api/contacts/:id
export const getContact = async (req: Request, res: Response): Promise<void> => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) { res.status(404).json(errorResponse('NOT_FOUND', 'Contact not found')); return; }
  res.json(contact);
};

// PUT /api/contacts/:id
export const updateContact = async (req: Request<{ id: string }, unknown, ContactWritePayload>, res: Response): Promise<void> => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!contact) { res.status(404).json(errorResponse('NOT_FOUND', 'Contact not found')); return; }
  res.json(contact);
};

// DELETE /api/contacts/:id
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) { res.status(404).json(errorResponse('NOT_FOUND', 'Contact not found')); return; }
  res.json({ success: true });
};
