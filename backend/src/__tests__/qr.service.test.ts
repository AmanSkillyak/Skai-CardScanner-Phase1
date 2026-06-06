import { ExtractedCard, QrExtractionResult } from '../types';
import {
  getQrDecodeDimensions,
  MAX_QR_IMAGE_DIMENSION,
  MAX_QR_IMAGE_PIXELS,
  mergeQrWithOcrResult,
  parseMeCard,
  parseQrContent,
  parseVCard,
} from '../services/qr/qr.service';

const makeOcrResult = (): ExtractedCard => ({
  person_name: 'OCR Name',
  designation: 'OCR Role',
  company_name: 'OCR Company',
  phones: ['9999999999'],
  emails: ['ocr@example.com'],
  website: 'https://ocr.example.com',
  address: {
    raw: 'OCR Street, OCR City, OCR State 110001',
    city: 'OCR City',
    state: 'OCR State',
    pincode: '110001',
  },
  social_links: {},
  gstin_or_tax_id: '',
});

const makeQrResult = (
  parsed_contact: QrExtractionResult['parsed_contact'],
  qr_type: QrExtractionResult['qr_type'] = 'vcard'
): QrExtractionResult => ({
  qr_detected: true,
  qr_type,
  raw_qr_text: 'BEGIN:VCARD\nEND:VCARD',
  parsed_contact,
});

describe('QR contact parsing', () => {
  it('parseVCard extracts name, company, title, phone, email, URL, and address', () => {
    const result = parseVCard(`BEGIN:VCARD
VERSION:3.0
FN:Aman Panwar
N:Panwar;Aman;;;
ORG:ABC Technologies Pvt Ltd
TITLE:Software Developer
TEL;TYPE=CELL:+91 9876543210
EMAIL:aman@example.com
URL:https://example.com
ADR:;;Street Address;Delhi;Delhi;110001;India
END:VCARD`);

    expect(result.person_name).toBe('Aman Panwar');
    expect(result.company_name).toBe('ABC Technologies Pvt Ltd');
    expect(result.designation).toBe('Software Developer');
    expect(result.phones).toEqual(['9876543210']);
    expect(result.emails).toEqual(['aman@example.com']);
    expect(result.website).toBe('https://example.com');
    expect(result.address).toEqual({
      raw: 'Street Address, Delhi, Delhi, 110001, India',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
    });
  });

  it('parseMeCard extracts name, phone, email, company, URL, and address', () => {
    const result = parseMeCard('MECARD:N:Aman Panwar;ORG:ABC Technologies;TEL:+91 9876543210;EMAIL:aman@example.com;URL:https://example.com;ADR:Delhi;;');

    expect(result.person_name).toBe('Aman Panwar');
    expect(result.company_name).toBe('ABC Technologies');
    expect(result.phones).toEqual(['9876543210']);
    expect(result.emails).toEqual(['aman@example.com']);
    expect(result.website).toBe('https://example.com');
    expect(result.address).toEqual({ raw: 'Delhi' });
  });

  it('URL QR maps social URL to social_links', () => {
    const result = parseQrContent('https://www.linkedin.com/in/aman-panwar');

    expect(result.qr_type).toBe('url');
    expect(result.parsed_contact.website).toBe('https://www.linkedin.com/in/aman-panwar');
    expect(result.parsed_contact.social_links).toEqual({
      linkedin: 'https://www.linkedin.com/in/aman-panwar',
    });
  });

  it('URL QR maps normal URL to website', () => {
    const result = parseQrContent('https://example.com');

    expect(result.qr_type).toBe('url');
    expect(result.parsed_contact.website).toBe('https://example.com');
    expect(result.parsed_contact.social_links).toBeUndefined();
  });

  it('QR address merge does not overwrite OCR address fields with undefined or empty QR values', () => {
    const merged = mergeQrWithOcrResult(makeOcrResult(), makeQrResult({
      address: {
        raw: '   ',
        city: undefined,
        state: '',
        pincode: undefined,
      },
    }));

    expect(merged.address).toEqual({
      raw: 'OCR Street, OCR City, OCR State 110001',
      city: 'OCR City',
      state: 'OCR State',
      pincode: '110001',
    });
  });

  it('QR address merge overwrites OCR address fields when QR provides non-empty values', () => {
    const merged = mergeQrWithOcrResult(makeOcrResult(), makeQrResult({
      address: {
        raw: 'QR Street, QR City, QR State 560001',
        city: 'QR City',
        state: 'QR State',
        pincode: '560001',
      },
    }));

    expect(merged.address).toEqual({
      raw: 'QR Street, QR City, QR State 560001',
      city: 'QR City',
      state: 'QR State',
      pincode: '560001',
    });
  });

  it('large QR image dimensions are downscaled before canvas pixel decoding', () => {
    const dimensions = getQrDecodeDimensions(12000, 8000);
    const pixels = dimensions.width * dimensions.height;

    expect(dimensions.width).toBeLessThanOrEqual(MAX_QR_IMAGE_DIMENSION);
    expect(dimensions.height).toBeLessThanOrEqual(MAX_QR_IMAGE_DIMENSION);
    expect(pixels).toBeLessThanOrEqual(MAX_QR_IMAGE_PIXELS);
    expect(dimensions.width / dimensions.height).toBeCloseTo(12000 / 8000, 2);
  });

  it('clears OCR-only person_name when a URL QR provides website but no contact identity fields', () => {
    const ocrResult = {
      ...makeOcrResult(),
      person_name: 'Ofciigss',
      designation: '',
      company_name: '',
      phones: [],
      emails: [],
      website: '',
      address: { raw: '' },
    };
    const merged = mergeQrWithOcrResult(ocrResult, makeQrResult({
      website: 'https://www.canvaqr.com/RGKjHDmCSi',
    }, 'url'));

    expect(merged.person_name).toBe('');
    expect(merged.website).toBe('https://www.canvaqr.com/RGKjHDmCSi');
    expect(merged.qr_detected).toBe(true);
    expect(merged.qr_type).toBe('url');
  });

  it('preserves readable OCR contact fields while merging a URL QR website', () => {
    const ocrResult = {
      ...makeOcrResult(),
      person_name: 'Aman Panwar',
      company_name: 'ABC Technologies',
      designation: '',
      emails: ['aman@example.com'],
      phones: [],
      website: '',
      address: { raw: '' },
    };
    const qrResult = parseQrContent('https://linkedin.com/in/aman');
    const merged = mergeQrWithOcrResult(ocrResult, qrResult);

    expect(merged.person_name).toBe('Aman Panwar');
    expect(merged.company_name).toBe('ABC Technologies');
    expect(merged.emails).toEqual(['aman@example.com']);
    expect(merged.website).toBe('https://linkedin.com/in/aman');
    expect(merged.social_links).toEqual({ linkedin: 'https://linkedin.com/in/aman' });
  });

  it('keeps a valid OCR name when QR contains a URL only', () => {
    const ocrResult = {
      ...makeOcrResult(),
      person_name: 'Aman Panwar',
      designation: '',
      company_name: '',
      phones: [],
      emails: [],
      website: '',
      address: { raw: '' },
    };
    const merged = mergeQrWithOcrResult(ocrResult, makeQrResult({
      website: 'https://example.com',
    }, 'url'));

    expect(merged.person_name).toBe('Aman Panwar');
    expect(merged.website).toBe('https://example.com');
  });

  it('keeps one name when OCR and QR vCard contain the same name', () => {
    const merged = mergeQrWithOcrResult({
      ...makeOcrResult(),
      person_name: 'Aman Panwar',
    }, makeQrResult({
      person_name: 'Aman Panwar',
    }));

    expect(merged.person_name).toBe('Aman Panwar');
  });

  it('prefers structured QR name over a slightly incorrect OCR name', () => {
    const merged = mergeQrWithOcrResult({
      ...makeOcrResult(),
      person_name: 'Aman Panwa',
    }, makeQrResult({
      person_name: 'Aman Panwar',
    }));

    expect(merged.person_name).toBe('Aman Panwar');
  });

  it('fills missing OCR phone and email from QR while preserving OCR name', () => {
    const ocrResult = {
      ...makeOcrResult(),
      person_name: 'Aman Panwar',
      phones: [],
      emails: [],
    };
    const merged = mergeQrWithOcrResult(ocrResult, makeQrResult({
      phones: ['+91 9876543210'],
      emails: ['aman@example.com'],
    }));

    expect(merged.person_name).toBe('Aman Panwar');
    expect(merged.phones).toEqual(['9876543210']);
    expect(merged.emails).toEqual(['aman@example.com']);
  });

  it('deduplicates phones and emails present in both OCR and QR', () => {
    const merged = mergeQrWithOcrResult({
      ...makeOcrResult(),
      phones: ['9876543210'],
      emails: ['aman@example.com'],
    }, makeQrResult({
      phones: ['+91 9876543210'],
      emails: ['AMAN@example.com'],
    }));

    expect(merged.phones).toEqual(['9876543210']);
    expect(merged.emails).toEqual(['aman@example.com']);
  });

  it('stores URL-only QR content as the decoded website without resolving it', () => {
    const result = parseQrContent('https://www.canvaqr.com/RGKjHDmCSi');

    expect(result.qr_type).toBe('url');
    expect(result.raw_qr_text).toBe('https://www.canvaqr.com/RGKjHDmCSi');
    expect(result.parsed_contact.website).toBe('https://www.canvaqr.com/RGKjHDmCSi');
  });
});
