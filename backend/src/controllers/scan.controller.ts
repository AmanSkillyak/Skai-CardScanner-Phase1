import { Request, Response } from 'express';
import Scan from '../models/Scan';
import { extractText } from '../services/ocr';
import { parseCard } from '../services/parser.service';
import { extractKeywords } from '../services/enrichment.service';
import { getCategory } from '../services/category.service';
import { extractQrFromImage, mergeQrWithOcrResult } from '../services/qr/qr.service';
import { SCAN_STATUS } from '../constants';
import { errorResponse } from '../utils/apiError';

const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Scan failed';

// POST /api/scans — process synchronously, return result immediately
export const createScan = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json(errorResponse('VALIDATION_ERROR', 'No file uploaded')); return; }

  const input_type = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
  const scan = await Scan.create({ input_type, file_path: req.file.path, status: SCAN_STATUS.processing });

  try {
    const rawText   = await extractText(req.file.path);
    const ocrParsed  = parseCard(rawText);
    let qrResult     = null;

    if (input_type === 'image') {
      try {
        qrResult = await extractQrFromImage(req.file.path);
      } catch (qrErr: unknown) {
        const message = qrErr instanceof Error ? qrErr.message : 'QR extraction failed';
        console.warn('QR extraction skipped:', message);
      }
    }

    // PDF QR extraction is skipped for now so the existing PDF OCR path remains unchanged.
    const parsed    = mergeQrWithOcrResult(ocrParsed, qrResult);
    const keywords  = extractKeywords(parsed.company_name, rawText, parsed.emails);
    const category  = await getCategory(parsed.company_name, keywords);
    const result    = { ...parsed, category, raw_ocr_text: rawText, keywords };

    await Scan.findByIdAndUpdate(scan._id, { status: SCAN_STATUS.completed, processedAt: new Date(), result });
    res.json({ scan_id: scan._id, status: SCAN_STATUS.completed, result });
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    await Scan.findByIdAndUpdate(scan._id, { status: SCAN_STATUS.failed, error_message: message });
    res.status(422).json(errorResponse('UPLOAD_ERROR', message));
  }
};

// GET /api/scans/:id/status
export const getScanStatus = async (req: Request, res: Response): Promise<void> => {
  const scan = await Scan.findById(req.params.id).select('status error_message');
  if (!scan) { res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found')); return; }
  res.json({ status: scan.status, error_message: scan.error_message });
};

// GET /api/scans/:id/result
export const getScanResult = async (req: Request, res: Response): Promise<void> => {
  const scan = await Scan.findById(req.params.id);
  if (!scan) { res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found')); return; }
  if (scan.status !== SCAN_STATUS.completed) { res.status(202).json({ status: scan.status }); return; }
  res.json(scan.result);
};
