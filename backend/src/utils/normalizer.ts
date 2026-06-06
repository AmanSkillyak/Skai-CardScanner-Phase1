const normalizePhone = (phone: string): string =>
  phone.replace(/[\s\-+]/g, '').replace(/^91/, '');

const normalizeEmail = (email: string): string =>
  email.toLowerCase().trim();

export const normalizePhones = (phones: string[]): string[] =>
  [...new Set(phones.map(normalizePhone).filter(Boolean))];

export const normalizeEmails = (emails: string[]): string[] =>
  [...new Set(emails.map(normalizeEmail).filter(Boolean))];
