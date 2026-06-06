import * as tesseract from './tesseract';
import * as googleVision from './googleVision';
import * as awsTextract from './awsTextract';

const providers: Record<string, { extractText: (f: string) => Promise<string> }> = {
  tesseract,
  google: googleVision,
  aws: awsTextract,
};

export const extractText = (filePath: string): Promise<string> => {
  const key = (process.env.OCR_PROVIDER || 'tesseract').toLowerCase();
  if (!providers[key]) throw new Error(`Unknown OCR provider: ${key}`);
  return providers[key].extractText(filePath);
};
