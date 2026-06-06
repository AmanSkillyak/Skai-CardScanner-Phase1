import { parseCard } from '../services/parser.service';

describe('parser phone extraction', () => {
  it('extracts Indian phone with OCR symbol prefix and split digits', () => {
    expect(parseCard('© +91950997 7778').phones).toEqual(['+919509977778']);
  });

  it('extracts Indian phone with spaced country code groups', () => {
    expect(parseCard('+91 950 997 7778').phones).toEqual(['+919509977778']);
  });

  it('extracts Indian phone with compact country code', () => {
    expect(parseCard('+919509977778').phones).toEqual(['+919509977778']);
  });

  it('extracts Indian phone without country code', () => {
    expect(parseCard('9509977778').phones).toEqual(['9509977778']);
  });

  it('rejects short or unrelated random numbers as phones', () => {
    const result = parseCard('Invoice 12345\nPIN 110001\nOrder 202406\nGST 27ABCDE1234F1Z5');

    expect(result.phones).toEqual([]);
  });
});

describe('parser designation extraction', () => {
  it('does not treat company service tagline as a person designation', () => {
    const result = parseCard(`OONTRACK
TURNKEY PROJECTS PVT LTD

GREEN BUILDING CONSULTANT &
FIRE FIGHTING CONTRACTOR

FIRE PROTECTION • CCTV • ENERGY EFFICIENT PRODUCTS`);

    expect(result.designation).toBe('');
  });

  it('preserves Managing Director as a valid designation', () => {
    expect(parseCard('Aman Panwar\nManaging Director\nABC Technologies').designation).toBe('Managing Director');
  });

  it('preserves Software Engineer as a valid designation', () => {
    expect(parseCard('Aman Panwar\nSoftware Engineer\nABC Technologies').designation).toBe('Software Engineer');
  });

  it('preserves Sales Manager as a valid designation', () => {
    expect(parseCard('Aman Panwar\nSales Manager\nABC Technologies').designation).toBe('Sales Manager');
  });
});

describe('parser person name extraction', () => {
  it('extracts a valid one-word name when followed by a known designation', () => {
    const result = parseCard(`AMAN
FULL STACK DEVELOPER
+91 9903434343
amanpanwar01@amazon.com`);

    expect(result.person_name).toBe('AMAN');
    expect(result.designation).toBe('FULL STACK DEVELOPER');
    expect(result.phones).toEqual(['+919903434343']);
    expect(result.emails).toEqual(['amanpanwar01@amazon.com']);
  });

  it('extracts a one-word name when noisy OCR lines appear before designation', () => {
    const result = parseCard(`AMAN
A “
ile FULL STACK DEVELOPER
ho TT E—
\\ 2
@ +919903434343
= amanpanwar01@amazon.com`);

    expect(result.person_name).toBe('AMAN');
    expect(result.designation).toBe('FULL STACK DEVELOPER');
    expect(result.phones).toEqual(['+919903434343']);
    expect(result.emails).toEqual(['amanpanwar01@amazon.com']);
  });

  it('rejects short OCR fragments as one-word names', () => {
    expect(parseCard('SL\n+91 9903434343\nsl@example.com').person_name).toBe('');
  });

  it('ignores product headings before the actual person name near a phone number', () => {
    const result = parseCard(`FABRIC PANELLING
WOODEN FLOORING

PRADEEP KUMAR
+91-93114 10503 / 84477 39254`);

    expect(result.person_name).toBe('PRADEEP KUMAR');
  });

  it('does not treat FABRIC PANELLING or WOODEN FLOORING as person_name', () => {
    const result = parseCard(`FABRIC PANELLING
WOODEN FLOORING
PRADEEP KUMAR
+91-93114 10503`);

    expect(result.person_name).not.toBe('FABRIC PANELLING');
    expect(result.person_name).not.toBe('WOODEN FLOORING');
  });

  it('does not select single product words as one-word names', () => {
    expect(parseCard('FABRIC\n+91 9903434343').person_name).toBe('');
    expect(parseCard('WOODEN\n+91 9903434343').person_name).toBe('');
    expect(parseCard('FLOORING\n+91 9903434343').person_name).toBe('');
  });

  it('preserves MAYANK KR SHARMA as a valid person name', () => {
    expect(parseCard('MAYANK KR SHARMA\n+91 950 997 7778').person_name).toBe('MAYANK KR SHARMA');
  });

  it('ignores product or service heading before name', () => {
    const result = parseCard(`ENERGY EFFICIENT PRODUCTS
SANTOSH KUMAR
santosh@example.com`);

    expect(result.person_name).toBe('SANTOSH KUMAR');
  });

  it('does not treat company name as person_name when a better human-like name exists', () => {
    const result = parseCard(`SKAI TECHNOLOGIES
RAHUL GUPTA
rahul@example.com`);

    expect(result.person_name).toBe('RAHUL GUPTA');
  });

  it('does not set person_name from an address-only contact block', () => {
    const result = parseCard(`Office:
17/5, (LGF) Kalkaji, New Delhi - 110019
Phones: 011-65490503, 26210503
Email: sales@fabrich.in
Website: fabrich.in`);

    expect(result.person_name).toBe('');
  });

  it('captures New Delhi address line with PIN in address.raw', () => {
    const result = parseCard(`Office:
17/5, (LGF) Kalkaji, New Delhi - 110019
Phones: 011-65490503, 26210503
Email: sales@fabrich.in
Website: fabrich.in`);

    expect(result.address.raw).toContain('17/5, (LGF) Kalkaji, New Delhi - 110019');
    expect(result.address.pincode).toBe('110019');
    expect(result.emails).toEqual(['sales@fabrich.in']);
    expect(result.website).toBe('fabrich.in');
  });

  it('does not treat contact labels as person names', () => {
    const result = parseCard(`Office:
Phones: 011-65490503
Email: sales@fabrich.in
Website: fabrich.in`);

    expect(result.person_name).toBe('');
  });
});

describe('parser real business card extraction', () => {
  it('extracts split company, landlines, fax, mobile, email, website, and address from Eurotex card text', () => {
    const result = parseCard(`PRASHANT KR. CHANCHAL
Area Sales Manager

Eurotex
S D A
ENTERPRISES

WOODEN FLOORING & WALLPAPERS
F-213 A, 1st Floor, Lado Sarai,
New Delhi-110030 INDIA
Phone : +91 11 29521111
        +91 11 29521399
Fax   : +91 11 29521499
Mobile: +91 98712 55399
sales@eurotexflooring.com
www.eurotexflooring.com`);

    expect(result.person_name).toBe('PRASHANT KR. CHANCHAL');
    expect(result.designation).toBe('Area Sales Manager');
    expect(result.company_name).toBe('S D A ENTERPRISES');
    expect(result.company_name).not.toBe('WOODEN FLOORING & WALLPAPERS');
    expect(result.emails).toEqual(['sales@eurotexflooring.com']);
    expect(['eurotexflooring.com', 'www.eurotexflooring.com']).toContain(result.website);
    expect(result.phones).toEqual([
      '+911129521111',
      '+911129521399',
      '+911129521499',
      '+919871255399',
    ]);
    expect(result.address.raw).toContain('F-213 A, 1st Floor, Lado Sarai');
    expect(result.address.raw).toContain('New Delhi-110030 INDIA');
    expect(result.address.pincode).toBe('110030');
  });

  it('prefers name before designation and visible split company over OCR fragments and domain fallback', () => {
    const result = parseCard(`SL
PRASHANT KR. CHANCHAL
Area Sales Manager

Eurotex
S D A
ENTERPRISES

WOODEN FLOORING & WALLPAPERS
F-213 A, 1st Floor, Lado Sarai,
New Delhi-110030 INDIA
Phone : +91 11 29521111
        29521399
Fax   : +91 11 29521499
Mobile: +91 98712 55399
sales@eurotexflooring.com
www.eurotexflooring.com`);

    expect(result.person_name).toBe('PRASHANT KR. CHANCHAL');
    expect(result.person_name).not.toBe('SL');
    expect(result.designation).toBe('Area Sales Manager');
    expect(result.company_name).toBe('S D A ENTERPRISES');
    expect(result.company_name).not.toBe('Eurotexflooring');
    expect(result.phones).toEqual([
      '+911129521111',
      '+911129521399',
      '+911129521499',
      '+919871255399',
    ]);
    expect(result.emails).toEqual(['sales@eurotexflooring.com']);
    expect(['eurotexflooring.com', 'www.eurotexflooring.com']).toContain(result.website);
  });

  it('normalizes OCR email variants with spaces and comma before suffix', () => {
    expect(parseCard('sales @ eurotexflooring . com').emails).toEqual(['sales@eurotexflooring.com']);
    expect(parseCard('sales@eurotexflooring,com').emails).toEqual(['sales@eurotexflooring.com']);
  });
});
