import path from 'path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import jsQR from 'jsqr';
import { ExtractedCard, QrExtractionResult, QrParsedContact, QrType } from '../../types';
import { normalizeEmails, normalizePhones } from '../../utils/normalizer';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
export const MAX_QR_IMAGE_DIMENSION = 2000;
export const MAX_QR_IMAGE_PIXELS = 4_000_000;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"']+|(?<!@)\b[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\.[A-Za-z]{2,}(?:\/[^\s<>"']*)?/gi;
const SOCIAL_PLATFORMS = ['linkedin', 'instagram', 'facebook', 'youtube'] as const;

type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
type AddressField = keyof ExtractedCard['address'];

const hasValue = (value?: string): value is string => Boolean(value?.trim());

const uniqueStrings = (values: string[]): string[] =>
  [...new Set(values.map(value => value.trim()).filter(Boolean))];

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim().replace(/[),.;]+$/, '');
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const getDecodedUrlValue = (value: string): string =>
  value.trim().replace(/[),.;]+$/, '');

const getSocialPlatform = (url: string): SocialPlatform | null => {
  const lower = url.toLowerCase();
  return SOCIAL_PLATFORMS.find(platform => lower.includes(`${platform}.com`)) || null;
};

const addUrlToContact = (contact: QrParsedContact, url: string): void => {
  const decodedUrl = getDecodedUrlValue(url);
  if (!decodedUrl) return;

  if (!contact.website) {
    contact.website = decodedUrl;
  }

  const platform = getSocialPlatform(normalizeUrl(decodedUrl));
  if (platform) {
    contact.social_links = { ...(contact.social_links || {}), [platform]: decodedUrl };
  }
};

const isSingleUrl = (value: string): boolean => {
  const matches = value.match(URL_RE) || [];
  if (matches.length !== 1 || matches[0] !== value) return false;

  try {
    new URL(normalizeUrl(value));
    return true;
  } catch {
    return false;
  }
};

const unfoldVCard = (rawText: string): string[] =>
  rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .reduce<string[]>((lines, line) => {
      if (/^[ \t]/.test(line) && lines.length > 0) {
        lines[lines.length - 1] += line.trimStart();
      } else {
        lines.push(line.trim());
      }
      return lines;
    }, [])
    .filter(Boolean);

const unescapeContactValue = (value: string): string =>
  value
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();

const splitEscaped = (value: string, separator: string): string[] => {
  const parts: string[] = [];
  let current = '';
  let escaped = false;

  for (const char of value) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      current += char;
      escaped = true;
      continue;
    }

    if (char === separator) {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  parts.push(current);
  return parts;
};

const getVCardValue = (line: string): string => {
  const index = line.indexOf(':');
  return index >= 0 ? unescapeContactValue(line.slice(index + 1)) : '';
};

const getVCardNameFromN = (value: string): string => {
  const [family = '', given = '', middle = '', prefix = '', suffix = ''] = splitEscaped(value, ';').map(unescapeContactValue);
  return uniqueStrings([prefix, given, middle, family, suffix]).join(' ');
};

const buildAddressFromParts = (parts: string[]): QrParsedContact['address'] | undefined => {
  const cleaned = parts.map(unescapeContactValue).filter(Boolean);
  const raw = cleaned.join(', ');
  if (!raw) return undefined;

  const [, , street = '', city = '', state = '', pincode = ''] = parts.map(unescapeContactValue);
  return {
    raw,
    city: city || undefined,
    state: state || undefined,
    pincode: pincode || undefined,
  };
};

const extractRegexContact = (rawText: string): QrParsedContact => {
  const contact: QrParsedContact = {};
  const emails = normalizeEmails(rawText.match(EMAIL_RE) || []);
  const phones = normalizePhones(rawText.match(PHONE_RE) || []);
  const urls = rawText.match(URL_RE) || [];

  if (emails.length > 0) contact.emails = emails;
  if (phones.length > 0) contact.phones = phones;
  urls.forEach(url => addUrlToContact(contact, url));

  return contact;
};

export const parseVCard = (rawText: string): QrParsedContact => {
  const contact: QrParsedContact = {};

  unfoldVCard(rawText).forEach(line => {
    const key = line.split(/[;:]/, 1)[0].toUpperCase();
    const value = getVCardValue(line);
    if (!value) return;

    switch (key) {
      case 'FN':
        contact.person_name = value;
        break;
      case 'N':
        if (!contact.person_name) {
          contact.person_name = getVCardNameFromN(value);
        }
        break;
      case 'ORG':
        contact.company_name = value;
        break;
      case 'TITLE':
        contact.designation = value;
        break;
      case 'TEL':
        contact.phones = normalizePhones([...(contact.phones || []), value]);
        break;
      case 'EMAIL':
        contact.emails = normalizeEmails([...(contact.emails || []), value]);
        break;
      case 'URL':
        addUrlToContact(contact, value);
        break;
      case 'ADR':
        contact.address = buildAddressFromParts(splitEscaped(value, ';'));
        break;
      default:
        break;
    }
  });

  return contact;
};

export const parseMeCard = (rawText: string): QrParsedContact => {
  const contact: QrParsedContact = {};
  const body = rawText.trim().replace(/^MECARD:/i, '').replace(/;{1,2}$/, '');

  splitEscaped(body, ';').forEach(part => {
    const separatorIndex = part.indexOf(':');
    if (separatorIndex < 0) return;

    const key = part.slice(0, separatorIndex).toUpperCase();
    const value = unescapeContactValue(part.slice(separatorIndex + 1));
    if (!value) return;

    switch (key) {
      case 'N':
        contact.person_name = value;
        break;
      case 'ORG':
        contact.company_name = value;
        break;
      case 'TEL':
        contact.phones = normalizePhones([...(contact.phones || []), value]);
        break;
      case 'EMAIL':
        contact.emails = normalizeEmails([...(contact.emails || []), value]);
        break;
      case 'URL':
        addUrlToContact(contact, value);
        break;
      case 'ADR':
        contact.address = { raw: value };
        break;
      default:
        break;
    }
  });

  return contact;
};

const getQrType = (rawText: string): QrType => {
  const trimmed = rawText.trim();
  if (/BEGIN:VCARD/i.test(trimmed)) return 'vcard';
  if (/^MECARD:/i.test(trimmed)) return 'mecard';
  if (isSingleUrl(trimmed)) return 'url';
  return 'text';
};

export const parseQrContent = (rawText: string): QrExtractionResult => {
  const trimmed = rawText.trim();
  const qrType = getQrType(trimmed);
  let parsedContact: QrParsedContact;

  if (qrType === 'vcard') {
    parsedContact = parseVCard(trimmed);
  } else if (qrType === 'mecard') {
    parsedContact = parseMeCard(trimmed);
  } else if (qrType === 'url') {
    parsedContact = {};
    addUrlToContact(parsedContact, trimmed);
  } else {
    parsedContact = extractRegexContact(trimmed);
  }

  return {
    qr_detected: true,
    qr_type: qrType,
    raw_qr_text: trimmed,
    parsed_contact: parsedContact,
  };
};

export const getQrDecodeDimensions = (
  width: number,
  height: number
): { width: number; height: number } => {
  const pixelCount = width * height;
  const scale = Math.min(
    1,
    MAX_QR_IMAGE_DIMENSION / width,
    MAX_QR_IMAGE_DIMENSION / height,
    Math.sqrt(MAX_QR_IMAGE_PIXELS / pixelCount)
  );

  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
};

export const extractQrFromImage = async (filePath: string): Promise<QrExtractionResult | null> => {
  const extension = path.extname(filePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) {
    return null;
  }

  const image = await loadImage(filePath);
  const decodeSize = getQrDecodeDimensions(image.width, image.height);
  const canvas = createCanvas(decodeSize.width, decodeSize.height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, decodeSize.width, decodeSize.height);
  const imageData = context.getImageData(0, 0, decodeSize.width, decodeSize.height);
  const decoded = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });

  return decoded?.data ? parseQrContent(decoded.data) : null;
};

const copyNonEmptyAddressField = (
  merged: ExtractedCard['address'],
  qrAddress: QrParsedContact['address'],
  field: AddressField
): void => {
  const value = qrAddress?.[field];
  if (typeof value === 'string' && value.trim()) {
    merged[field] = value;
  }
};

const mergeAddress = (
  ocrAddress: ExtractedCard['address'],
  qrAddress?: QrParsedContact['address']
): ExtractedCard['address'] => {
  const merged = { ...ocrAddress };
  (['raw', 'city', 'state', 'pincode'] as const).forEach(field => {
    copyNonEmptyAddressField(merged, qrAddress, field);
  });
  return merged;
};

const hasMeaningfulAddress = (address: ExtractedCard['address']): boolean =>
  hasValue(address.raw) ||
  hasValue(address.city) ||
  hasValue(address.state) ||
  hasValue(address.pincode);

const isLikelyGarbageName = (personName: string): boolean => {
  const cleaned = personName.trim().replace(/\s+/g, ' ');
  if (!cleaned) return false;
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(cleaned)) return true;

  const words = cleaned.split(' ').filter(Boolean);
  if (words.length >= 2) return false;
  if (cleaned.length <= 6) return false;

  const word = cleaned.toLowerCase();
  const hasRepeatedLetters = /([a-z])\1/.test(word);
  const hasHardConsonantCluster = /[bcdfghjklmnpqrstvwxyz]{3,}/.test(word);
  return hasRepeatedLetters && hasHardConsonantCluster;
};

const isMeaningfulOcrResult = (ocrResult: ExtractedCard): boolean =>
  ocrResult.phones.length > 0 ||
  ocrResult.emails.length > 0 ||
  hasValue(ocrResult.company_name) ||
  hasValue(ocrResult.designation) ||
  hasMeaningfulAddress(ocrResult.address) ||
  (hasValue(ocrResult.person_name) && !isLikelyGarbageName(ocrResult.person_name));

const hasQrContactValue = (qrContact: QrParsedContact): boolean =>
  hasValue(qrContact.person_name) ||
  hasValue(qrContact.designation) ||
  hasValue(qrContact.company_name) ||
  hasValue(qrContact.website) ||
  Boolean(qrContact.phones?.length) ||
  Boolean(qrContact.emails?.length) ||
  Boolean(qrContact.social_links && Object.keys(qrContact.social_links).length > 0) ||
  Boolean(qrContact.address && hasMeaningfulAddress(qrContact.address));

const shouldSuppressOcrGarbage = (
  ocrResult: ExtractedCard,
  qrResult: QrExtractionResult,
  qrContact: QrParsedContact
): boolean =>
  qrResult.qr_detected &&
  hasQrContactValue(qrContact) &&
  hasValue(ocrResult.person_name) &&
  !isMeaningfulOcrResult(ocrResult);

const mergeContactFields = (
  ocrResult: ExtractedCard,
  qrResult: QrExtractionResult,
  qrContact: QrParsedContact
): Pick<ExtractedCard, 'person_name' | 'designation' | 'company_name' | 'phones' | 'emails' | 'website' | 'address' | 'social_links'> => {
  const suppressOcr = shouldSuppressOcrGarbage(ocrResult, qrResult, qrContact);
  const ocrPersonName = suppressOcr ? '' : ocrResult.person_name;

  return {
    person_name: qrContact.person_name || ocrPersonName,
    designation: qrContact.designation || ocrResult.designation,
    company_name: qrContact.company_name || ocrResult.company_name,
    phones: normalizePhones([...(qrContact.phones || []), ...ocrResult.phones]),
    emails: normalizeEmails([...(qrContact.emails || []), ...ocrResult.emails]),
    website: qrContact.website || ocrResult.website,
    address: mergeAddress(ocrResult.address, qrContact.address),
    social_links: {
      ...ocrResult.social_links,
      ...(qrContact.social_links || {}),
    },
  };
};

export const mergeQrWithOcrResult = (
  ocrResult: ExtractedCard,
  qrResult: QrExtractionResult | null
): ExtractedCard & Partial<Pick<QrExtractionResult, 'qr_detected' | 'qr_type' | 'raw_qr_text'>> => {
  if (!qrResult) return ocrResult;

  const qrContact = qrResult.parsed_contact;
  const mergedContact = mergeContactFields(ocrResult, qrResult, qrContact);

  return {
    ...ocrResult,
    ...mergedContact,
    qr_detected: qrResult.qr_detected,
    qr_type: qrResult.qr_type,
    raw_qr_text: qrResult.raw_qr_text,
  };
};
