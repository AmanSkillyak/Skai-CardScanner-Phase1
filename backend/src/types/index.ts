import { Types } from 'mongoose';
import { SCAN_STATUSES } from '../constants';

export type ScanStatus = (typeof SCAN_STATUSES)[number];

export type ExportFormat = 'csv' | 'xlsx';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'UPLOAD_ERROR'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ExtractedCard {
  person_name: string;
  designation: string;
  company_name: string;
  phones: string[];
  emails: string[];
  website: string;
  address: {
    raw: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  social_links: Record<string, string>;
  gstin_or_tax_id: string;
}

export type QrType = 'vcard' | 'mecard' | 'url' | 'text';

export interface QrParsedContact {
  person_name?: string;
  designation?: string;
  company_name?: string;
  phones?: string[];
  emails?: string[];
  website?: string;
  address?: {
    raw: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  social_links?: Record<string, string>;
}

export interface QrMetadata {
  qr_detected: boolean;
  qr_type: QrType;
  raw_qr_text: string;
}

export interface QrExtractionResult extends QrMetadata {
  parsed_contact: QrParsedContact;
}

export interface ScanResult extends ExtractedCard {
  category: {
    suggested_category: string;
    confidence: number;
    reason: string;
    needs_review: boolean;
  };
  raw_ocr_text: string;
  keywords: string[];
  qr_detected?: boolean;
  qr_type?: QrType;
  raw_qr_text?: string;
}

export interface IContact {
  person_name: string;
  designation?: string;
  company_name?: string;
  phones: string[];
  emails: string[];
  website?: string;
  address?: {
    raw?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  social_links?: Record<string, string>;
  gstin_or_tax_id?: string;
  raw_ocr_text?: string;
  extraction_confidence?: number;
  cardImage?: string;
  scan_id?: Types.ObjectId;
  category?: string;
  keywords?: string[];
}

export interface IScan {
  user_id?: string | null;
  workspace_id?: string | null;
  input_type: 'image' | 'pdf';
  file_path: string;
  status: ScanStatus;
  error_message?: string;
  expires_at?: Date | null;
  processedAt?: Date;
  result?: ScanResult;
}

export interface ICategory {
  name: string;
  keywords: string[];
  is_active: boolean;
  parent_id?: Types.ObjectId | null;
}

export interface ContactWritePayload extends Partial<IContact> {
  person_name?: string;
  emails?: string[];
  phones?: string[];
}

export interface ContactSearchQuery {
  search?: string;
  category?: string;
}

export type ContactSearchCondition =
  | { person_name: RegExp }
  | { company_name: RegExp }
  | { designation: RegExp }
  | { website: RegExp }
  | { emails: RegExp }
  | { phones: RegExp }
  | { 'address.raw': RegExp }
  | { category: RegExp }
  | { 'category.suggested_category': RegExp };

export interface ContactFilter {
  category?: string;
  $or?: ContactSearchCondition[];
}

export interface ExportRequestBody {
  format?: ExportFormat;
  ids?: string[];
  contact_ids?: string[];
}

export interface CategorySuggestPayload {
  company_name?: string;
  raw_text?: string;
  raw_ocr_text?: string;
  emails?: string[];
  keywords?: string[];
}

export interface ExportContactProjection {
  person_name?: string;
  designation?: string;
  company_name?: string;
  website?: string;
  category?: string;
  createdAt?: Date;
}

export interface ExportRow {
  Name: string;
  Designation: string;
  Company: string;
  Website: string;
  Category: string;
  'Created At': string;
}
