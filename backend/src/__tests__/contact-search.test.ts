import { buildContactFilter } from '../controllers/contact.controller';
import { ContactSearchCondition } from '../types';

type ContactSearchField =
  | 'person_name'
  | 'company_name'
  | 'designation'
  | 'website'
  | 'emails'
  | 'phones'
  | 'address.raw'
  | 'category'
  | 'category.suggested_category';

const regexFor = (conditions: ContactSearchCondition[], field: ContactSearchField): RegExp => {
  const match = conditions.find(condition => field in condition);
  expect(match).toBeDefined();

  const value = Object.values(match as Record<string, RegExp>)[0];
  expect(value).toBeInstanceOf(RegExp);
  return value;
};

const regexesFor = (conditions: ContactSearchCondition[], field: ContactSearchField): RegExp[] =>
  conditions
    .filter(condition => field in condition)
    .map(condition => Object.values(condition as Record<string, RegExp>)[0]);

describe('contact search filter', () => {
  it('searches by person name', () => {
    const filter = buildContactFilter('Aman');

    expect(regexFor(filter.$or || [], 'person_name').test('Aman Panwar')).toBe(true);
  });

  it('searches by company', () => {
    const filter = buildContactFilter('Skai');

    expect(regexFor(filter.$or || [], 'company_name').test('Skai Technologies')).toBe(true);
  });

  it('searches by phone across country code and formatting variants', () => {
    const filter = buildContactFilter('9903434343');
    const phoneRegexes = regexesFor(filter.$or || [], 'phones');

    expect(phoneRegexes.some(regex => regex.test('+919903434343'))).toBe(true);
    expect(phoneRegexes.some(regex => regex.test('9903434343'))).toBe(true);
    expect(phoneRegexes.some(regex => regex.test('+91 99034 34343'))).toBe(true);
  });

  it('searches by phone when the query includes country code formatting', () => {
    const filter = buildContactFilter('+91 99034 34343');
    const phoneRegexes = regexesFor(filter.$or || [], 'phones');

    expect(phoneRegexes.some(regex => regex.test('9903434343'))).toBe(true);
  });

  it('searches by email', () => {
    const filter = buildContactFilter('sales@example.com');

    expect(regexFor(filter.$or || [], 'emails').test('sales@example.com')).toBe(true);
  });

  it('searches by category string and suggested category object shape', () => {
    const filter = buildContactFilter('Construction');

    expect(regexFor(filter.$or || [], 'category').test('Real Estate and Construction')).toBe(true);
    expect(regexFor(filter.$or || [], 'category.suggested_category').test('Construction')).toBe(true);
  });

  it('searches by website and address', () => {
    const filter = buildContactFilter('example');

    expect(regexFor(filter.$or || [], 'website').test('https://example.com')).toBe(true);
    expect(regexFor(filter.$or || [], 'address.raw').test('12 Example Road')).toBe(true);
  });
});
