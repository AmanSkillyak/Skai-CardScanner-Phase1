import { EXPORT_FORMATS, SCAN_STATUS } from '../constants';

export type ScanStatus = (typeof SCAN_STATUS)[keyof typeof SCAN_STATUS];

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export interface Address {
  raw?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface CategoryResult {
  suggested_category: string;
  confidence: number;
  reason: string;
  needs_review: boolean;
}

export interface ExtractedCard {
  person_name: string;
  designation?: string;
  company_name?: string;
  phones: string[];
  emails: string[];
  website?: string;
  address?: Address;
  social_links?: Record<string, string>;
  gstin_or_tax_id?: string;
  raw_ocr_text?: string;
  category?: CategoryResult;
  keywords?: string[];
  qr_detected?: boolean;
  qr_type?: 'vcard' | 'mecard' | 'url' | 'text';
  raw_qr_text?: string;
}

export interface ContactLegacyAliases {
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
}

export interface Contact extends ContactLegacyAliases {
  _id: string;
  person_name: string;
  designation?: string;
  company_name?: string;
  phones: string[];
  emails: string[];
  website?: string;
  address?: Address;
  category?: string;
  cardImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScanCardResponse {
  scan_id: string;
  status: ScanStatus | string;
  result: ExtractedCard;
}

export interface ContactListParams {
  search?: string;
  category?: string;
}

export interface ContactSavePayload {
  person_name: string;
  designation?: string;
  company_name?: string;
  website?: string;
  gstin_or_tax_id?: string;
  emails: string[];
  phones: string[];
  category?: string;
  raw_ocr_text?: string;
}

export interface ContactUpdatePayload {
  name?: string;
  companyName?: string;
  category?: string;
}

export interface CategorySuggestPayload {
  company_name: string;
  raw_text?: string;
  emails?: string[];
}
