import { ExtractedCard } from '../types';
import { normalizeEmails } from '../utils/normalizer';

const EMAIL_RE    = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const OCR_EMAIL_RE = /[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9-]+(?:\s*[.,]\s*[A-Za-z0-9-]+)+/g;
const PHONE_CANDIDATE_RE = /\+?\d[\d\s().-]{6,}\d/g;
const PHONE_CONTEXT_RE = /\b(?:phone|phones|tel|fax|mobile|mob)\b/i;
const COMPANY_RE  = /\b[\w\s]+(?:Pvt\.?\s*Ltd\.?|Private\s+Limited|Limited|Inc\.?|LLP|LLC)\b/i;
const WEBSITE_RE  = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i;
const GSTIN_RE    = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/;
const SOCIAL_RE   = /(?:linkedin|instagram|facebook|youtube|twitter)\.com\/[\w\-./]+/gi;
const DESIGNATION_KEYWORDS = ['ceo','cto','coo','cfo','founder','co-founder','director','manager','engineer','developer','designer','consultant','analyst','executive','president','vp','head','lead','officer','proprietor','partner','associate','intern'];
const COMPANY_KEYWORDS     = ['pvt','ltd','limited','inc','llp','llc','private','corp','technologies','solutions','services','enterprises','industries','group'];
const COMPANY_SUFFIX_RE = /^(?:ENTERPRISES|PVT\.?\s*LTD\.?|PRIVATE\s+LIMITED|LTD\.?|LLP|INDUSTRIES|TRADERS|AGENCIES|CORPORATION)$/i;
const SERVICE_DESIGNATION_WORDS = ['consultant','contractor','supplier','dealer','distributor','manufacturer','services','products','projects'];
const PRODUCT_SERVICE_KEYWORDS = ['fire protection','cctv','energy','products','turnkey projects'];
const PRODUCT_SERVICE_NAME_KEYWORDS = [
  'fabric',
  'panelling',
  'paneling',
  'wooden',
  'flooring',
  'services',
  'products',
  'solutions',
  'supplier',
  'manufacturer',
  'contractor',
  'consultant',
  'trader',
  'dealer',
  'distributor',
];
const ADDRESS_LABEL_RE = /\b(?:office|address|add|location)\b/i;
const CONTACT_LABEL_RE = /\b(?:phone|phones|tel|mobile|mob|email|e-mail|website|web)\b/i;
const ADDRESS_INDICATOR_RE = /\b(?:new delhi|delhi|jaipur|mumbai|kalkaji|lgf|floor|road|street|nagar|colony|sector|pin|postal|zip|plot\s*no)\b/i;
const POSTAL_CODE_RE = /\b\d{6}\b/;
const BUILDING_ADDRESS_RE = /\b(?:[A-Z]-\d{1,5}|\d{1,5}\/\d{1,5}|plot\s*no\.?)\b/i;

const cleanName = (line: string): string =>
  line.replace(/^([^a-zA-Z]*\b\w{1,3}\b\s+)+/, '').trim();

const normalizeOcrPhone = (
  phone: string,
  hasPhoneContext: boolean,
  inheritedCountryAreaPrefix?: string
): string | null => {
  const compact = phone.replace(/[\s().-]/g, '');
  const digits = compact.replace(/\D/g, '');
  const hasCountryCode = compact.startsWith('+91');

  if (hasCountryCode && digits.length === 12 && digits.startsWith('91')) {
    return `+91${digits.slice(2)}`;
  }

  if (hasCountryCode && hasPhoneContext && digits.length > 10 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  if (hasPhoneContext && digits.length === 11 && digits.startsWith('0')) {
    return digits;
  }

  if (hasPhoneContext && digits.length === 10) {
    return digits;
  }

  if (hasPhoneContext && digits.length >= 7 && digits.length <= 8 && inheritedCountryAreaPrefix) {
    return `${inheritedCountryAreaPrefix}${digits}`;
  }

  return null;
};

const extractPhones = (rawText: string): string[] => {
  const rawLines = rawText.split('\n');
  const phones: string[] = [];
  let previousLineHadPhoneContext = false;
  let inheritedCountryAreaPrefix: string | undefined;

  rawLines.forEach((line, index) => {
    const candidates = [...line.matchAll(PHONE_CANDIDATE_RE)];
    const hasPhoneContext =
      PHONE_CONTEXT_RE.test(line) ||
      (candidates.length > 0 && previousLineHadPhoneContext) ||
      (line.trim().startsWith('+91') && index > 0 && PHONE_CONTEXT_RE.test(rawLines[index - 1]));

    const normalizedPhones = candidates
      .map(match => normalizeOcrPhone(match[0], hasPhoneContext, inheritedCountryAreaPrefix))
      .filter((phone): phone is string => Boolean(phone));

    normalizedPhones.forEach(phone => {
      phones.push(phone);
      const digits = phone.replace(/\D/g, '');
      if (phone.startsWith('+91') && digits.length > 10 && !/^\+91[6-9]\d{9}$/.test(phone)) {
        inheritedCountryAreaPrefix = phone.slice(0, phone.length - 8);
      }
    });

    previousLineHadPhoneContext = hasPhoneContext && normalizedPhones.length > 0;
  });

  return [...new Set(phones)];
};

const hasPhone = (text: string): boolean =>
  extractPhones(text).length > 0;

const normalizeOcrEmail = (email: string): string =>
  email
    .toLowerCase()
    .replace(/\s*@\s*/g, '@')
    .replace(/\s*[,.]\s*/g, '.')
    .trim();

const extractEmails = (rawText: string): string[] => {
  const emails = [
    ...rawText.match(EMAIL_RE) || [],
    ...rawText.match(OCR_EMAIL_RE) || [],
  ].map(normalizeOcrEmail);

  return normalizeEmails(emails);
};

const hasEmail = (text: string): boolean =>
  extractEmails(text).length > 0;

const isAllCapsLine = (line: string): boolean => {
  const letters = line.replace(/[^A-Za-z]/g, '');
  return letters.length > 0 && letters === letters.toUpperCase();
};

const hasServiceDesignationWord = (line: string): boolean => {
  const lower = line.toLowerCase();
  return SERVICE_DESIGNATION_WORDS.some(word => lower.includes(word));
};

const hasProductServiceKeyword = (line: string): boolean => {
  const lower = line.toLowerCase();
  return PRODUCT_SERVICE_KEYWORDS.some(keyword => lower.includes(keyword));
};

const isLikelyServiceDescriptionLine = (line: string, lines: string[], index: number): boolean => {
  if (isAllCapsLine(line) && hasServiceDesignationWord(line)) {
    return true;
  }

  const nearbyLines = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 2));
  return nearbyLines.some(hasProductServiceKeyword) && hasServiceDesignationWord(line);
};

const hasProductServiceNameKeyword = (line: string): boolean => {
  const lower = line.toLowerCase();
  return PRODUCT_SERVICE_NAME_KEYWORDS.some(keyword => lower.includes(keyword));
};

const isLikelyProductServiceHeading = (line: string): boolean =>
  hasProductServiceNameKeyword(line) && isAllCapsLine(line);

const isSpacedCapitalInitials = (line: string): boolean =>
  /^(?:[A-Z][.\s]+){1,}[A-Z]\.?$/.test(line.trim());

const extractSplitCompanyName = (lines: string[]): string => {
  for (let i = 0; i < lines.length - 1; i += 1) {
    const current = lines[i].replace(/\./g, '').replace(/\s+/g, ' ').trim();
    const next = lines[i + 1];

    if (isSpacedCapitalInitials(current) && COMPANY_SUFFIX_RE.test(next) && !isLikelyProductServiceHeading(current)) {
      return `${current} ${next}`.trim();
    }
  }

  return '';
};

const getNameWords = (line: string): string[] =>
  line
    .replace(/[^A-Za-z .'’-]/g, ' ')
    .split(/\s+/)
    .map(word => word.replace(/[.'’-]/g, '').trim())
    .filter(Boolean);

const isHumanLikeName = (line: string): boolean => {
  const words = getNameWords(line);
  if (words.length < 2 || words.length > 3) return false;
  if (hasProductServiceNameKeyword(line)) return false;
  return words.every(word => /^[A-Za-z]{2,}$/.test(word));
};

const isOneWordName = (line: string): boolean => {
  const words = getNameWords(line);
  if (words.length !== 1) return false;
  if (hasProductServiceNameKeyword(line)) return false;
  return /^[A-Za-z]{3,}$/.test(words[0]);
};

const isContactLine = (line: string): boolean =>
  hasEmail(line) || hasPhone(line);

const isDesignationLine = (line: string, lines: string[], index: number): boolean => {
  const l = line.toLowerCase();
  return DESIGNATION_KEYWORDS.some(k => l.includes(k)) &&
    !hasEmail(line) &&
    !hasPhone(line) &&
    !isLikelyServiceDescriptionLine(line, lines, index);
};

const isNoisyOcrLine = (line: string): boolean => {
  const letters = line.replace(/[^A-Za-z]/g, '');
  const nonSpaceCharacters = line.replace(/\s/g, '');

  if (!nonSpaceCharacters) return true;
  if (letters.length <= 1) return true;
  return letters.length <= 3 && letters.length / nonSpaceCharacters.length < 0.6;
};

const isAddressOrContactLine = (line: string): boolean =>
  ADDRESS_LABEL_RE.test(line) ||
  CONTACT_LABEL_RE.test(line) ||
  ADDRESS_INDICATOR_RE.test(line) ||
  POSTAL_CODE_RE.test(line) ||
  BUILDING_ADDRESS_RE.test(line);

const isNearContactLine = (lines: string[], index: number): boolean => {
  const nearbyLines = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3));
  return nearbyLines.some(isContactLine);
};

const isFollowedByDesignation = (lines: string[], index: number): boolean =>
  index < lines.length - 1 && isDesignationLine(lines[index + 1], lines, index + 1);

const isFollowedByNearbyDesignation = (lines: string[], index: number): boolean => {
  for (let offset = 1; offset <= 3 && index + offset < lines.length; offset += 1) {
    const line = lines[index + offset];
    if (isDesignationLine(line, lines, index + offset)) return true;
    if (isNoisyOcrLine(line)) continue;
    return false;
  }

  return false;
};

const isStrongHeaderNamePosition = (lines: string[], index: number): boolean =>
  index <= 1 && isNearContactLine(lines, index);

const isContextualOneWordName = (line: string, lines: string[], index: number): boolean =>
  isOneWordName(line) && (isFollowedByNearbyDesignation(lines, index) || isStrongHeaderNamePosition(lines, index));

const isNameCandidate = (line: string, lines: string[], index: number): boolean => {
  const l = line.toLowerCase();
  const words = getNameWords(line);
  if (hasEmail(line)) return false;
  if (hasPhone(line)) return false;
  if (WEBSITE_RE.test(line)) return false;
  if (GSTIN_RE.test(line)) return false;
  if (isAddressOrContactLine(line)) return false;
  if (COMPANY_KEYWORDS.some(k => l.includes(k))) return false;
  if (DESIGNATION_KEYWORDS.some(k => l.includes(k))) return false;
  if (isLikelyProductServiceHeading(line)) return false;
  if (words.length === 1) return isContextualOneWordName(line, lines, index);
  if (words.length < 2) return false;
  if (!isHumanLikeName(line)) return false;
  return true;
};

const scoreNameCandidate = (line: string, lines: string[], index: number): number => {
  let score = 0;
  const words = getNameWords(line);

  if (isHumanLikeName(line)) score += 40;
  if (isContextualOneWordName(line, lines, index)) score += 30;
  if (words.length === 2 || words.length === 3) score += 12;
  if (isFollowedByDesignation(lines, index)) score += 80;
  else if (isFollowedByNearbyDesignation(lines, index)) score += 60;
  if (isNearContactLine(lines, index)) score += 24;
  if (hasProductServiceNameKeyword(line)) score -= 50;
  score -= index;

  return score;
};

const extractPersonName = (lines: string[]): string => {
  const candidates = lines
    .map((line, index) => ({ line, index, score: scoreNameCandidate(line, lines, index) }))
    .filter(candidate => isNameCandidate(candidate.line, lines, candidate.index))
    .sort((a, b) => b.score - a.score);

  return cleanName(candidates[0]?.line || '');
};

const cleanDesignation = (line: string): string => {
  const words = line.trim().split(/\s+/);
  if (words.length < 2 || !/^[a-z]{1,3}$/.test(words[0])) {
    return line;
  }

  const withoutPrefix = words.slice(1).join(' ');
  const lower = withoutPrefix.toLowerCase();
  return DESIGNATION_KEYWORDS.some(keyword => lower.includes(keyword)) ? withoutPrefix : line;
};

export const parseCard = (rawText: string): ExtractedCard => {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const emails  = extractEmails(rawText);
  const phones  = extractPhones(rawText);
  const website = (rawText.match(WEBSITE_RE) || [])[0] || '';
  const gstin   = (rawText.match(GSTIN_RE) || [])[0] || '';
  const social_links: Record<string, string> = {};
  (rawText.match(SOCIAL_RE) || []).forEach(link => {
    const platform = link.split('.com')[0].split('/').pop() || 'other';
    social_links[platform] = link;
  });

  // Company
  const splitCompanyName = extractSplitCompanyName(lines);
  const companyMatch = rawText.match(COMPANY_RE);
  let company_name = splitCompanyName || (companyMatch ? companyMatch[0].trim() : '');
  if (!company_name && emails[0]) {
    const domain = emails[0].split('@')[1] || '';
    const base = domain.split('.')[0];
    company_name = base.charAt(0).toUpperCase() + base.slice(1);
  }

  // Designation
  const designation = cleanDesignation(lines.find((line, index) => isDesignationLine(line, lines, index)) || '');

  const person_name = extractPersonName(lines);

  // Address: lines with city/state/pin patterns
  const ADDRESS_RE = /\b(?:\d{6}|\d{5}|sector|nagar|road|street|avenue|colony|phase|block|floor|plot|near|opp|behind|above|below|city|state|district|india|delhi|mumbai|bangalore|hyderabad|chennai|kolkata|pune|noida|gurgaon|ahmedabad|kalkaji|lgf|office|address|location)\b/i;
  const addressLines = lines.filter(line =>
    ADDRESS_RE.test(line) && !hasEmail(line) && !hasPhone(line)
  );
  const pinMatch = rawText.match(/\b\d{6}\b/);

  return {
    person_name,
    designation,
    company_name,
    phones,
    emails,
    website,
    address: {
      raw: addressLines.join(', '),
      pincode: pinMatch ? pinMatch[0] : undefined,
    },
    social_links,
    gstin_or_tax_id: gstin,
  };
};
