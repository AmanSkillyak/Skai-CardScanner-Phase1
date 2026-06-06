import { Request, Response } from 'express';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import Contact from '../models/Contact';
import { ExportContactProjection, ExportRequestBody, ExportRow } from '../types';

const FIELDS = ['person_name','designation','company_name','website','category','createdAt'];

// POST /api/exports
export const exportContacts = async (req: Request<unknown, unknown, ExportRequestBody>, res: Response): Promise<void> => {
  const { format = 'csv', ids, contact_ids } = req.body;
  const selectedIds = ids || contact_ids;
  const filter = selectedIds?.length ? { _id: { $in: selectedIds } } : {};
  const contacts = await Contact.find(filter).select(FIELDS.join(' ')).lean<ExportContactProjection[]>();

  const rows: ExportRow[] = contacts.map((c) => ({
    Name: c.person_name || '',
    Designation: c.designation || '',
    Company: c.company_name || '',
    Website: c.website || '',
    Category: c.category || '',
    'Created At': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
  }));

  if (format === 'xlsx') {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Contacts');
    ws.columns = Object.keys(rows[0] || {}).map(k => ({ header: k, key: k, width: 20 }));
    ws.addRows(rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');
    await wb.xlsx.write(res);
    res.end();
    return;
  }

  // Default CSV
  const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
  const csv = parser.parse(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
  res.send(csv);
};
