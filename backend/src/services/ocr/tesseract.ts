import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const extractText = async (filePath: string): Promise<string> => {
  let source: string = filePath;
  let tmpFile: string | null = null;

  if (path.extname(filePath).toLowerCase() === '.pdf') {
    const { pdf } = await import('pdf-to-img');
    const doc = await pdf(filePath, { scale: 3 });
    for await (const page of doc as unknown as AsyncIterable<Buffer>) {
      tmpFile = path.join(os.tmpdir(), `ocr_${Date.now()}.png`);
      fs.writeFileSync(tmpFile, page);
      source = tmpFile;
      break;
    }
  }

  try {
    const { data: { text } } = await Tesseract.recognize(source, 'eng');
    if (!text || text.trim().length < 3) throw new Error('Please upload a clearer image.');
    return text.trim();
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
};
