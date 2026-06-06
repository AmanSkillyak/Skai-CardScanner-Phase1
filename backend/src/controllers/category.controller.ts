import { Request, Response } from 'express';
import Category from '../models/Category';
import { getCategory } from '../services/category.service';
import { extractKeywords } from '../services/enrichment.service';
import { CategorySuggestPayload } from '../types';

// GET /api/categories
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await Category.find({ is_active: true }).select('name keywords');
  res.json(categories);
};

// POST /api/categories/suggest
export const suggestCategory = async (req: Request<unknown, unknown, CategorySuggestPayload>, res: Response): Promise<void> => {
  const { company_name = '', raw_text = '', raw_ocr_text = '', emails = [], keywords: providedKeywords = [] } = req.body;
  const sourceText = raw_text || raw_ocr_text;
  const keywords = [...new Set([
    ...extractKeywords(company_name, sourceText, emails),
    ...(Array.isArray(providedKeywords) ? providedKeywords.filter((item): item is string => typeof item === 'string') : []),
  ])];
  const result = await getCategory(company_name, keywords);
  res.json(result);
};
