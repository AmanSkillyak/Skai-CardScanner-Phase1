// ============================================================
// CardForm.tsx — Editable review form for extracted card data
// ============================================================
// After OCR extracts data, this form lets the user:
// - Review and edit all fields before saving
// - See the suggested category
// - Toggle raw OCR text for reference
// - Save to database or scan another card
// ============================================================

import { useState } from 'react';
import { ContactSavePayload, ExtractedCard } from '../types';
import { saveContact } from '../services/api';
import CategorySelector from './CategorySelector';
import { extractApiErrorMessage } from '../utils/apiError';

interface Props { data: ExtractedCard; onSaved: () => void; onReset: () => void }

type EditableTextField = 'person_name' | 'designation' | 'company_name' | 'website' | 'gstin_or_tax_id';

interface CardFormState extends Omit<ExtractedCard, 'phones' | 'emails'> {
  phones: string;
  emails: string;
}

// Fields displayed in the form (key maps to ExtractedCard property)
const FIELDS: { key: EditableTextField; label: string; required?: boolean }[] = [
  { key: 'person_name',    label: 'Name',        required: true },
  { key: 'designation',    label: 'Designation' },
  { key: 'company_name',   label: 'Company' },
  { key: 'website',        label: 'Website' },
  { key: 'gstin_or_tax_id', label: 'GSTIN' },
];

export default function CardForm({ data, onSaved, onReset }: Props) {
  // Form state: flatten arrays to comma-separated strings for editing
  const [form, setForm]       = useState<CardFormState>({ ...data, phones: (data.phones || []).join(', '), emails: (data.emails || []).join(', ') });
  const [category, setCategory] = useState(data.category?.suggested_category || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const set = (key: EditableTextField | 'phones' | 'emails', val: string) => setForm(f => ({ ...f, [key]: val }));

  // Save contact to backend (maps form fields to backend's expected format)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.person_name?.trim()) return setError('Name is required');
    setLoading(true); setError('');
    try {
      const payload: ContactSavePayload = {
        person_name: form.person_name || '',
        designation: form.designation || '',
        company_name: form.company_name || '',
        website: form.website || '',
        gstin_or_tax_id: form.gstin_or_tax_id || '',
        emails: form.emails.split(',').map((s: string) => s.trim()).filter(Boolean),
        phones: form.phones.split(',').map((s: string) => s.trim()).filter(Boolean),
        category,
        raw_ocr_text: data.raw_ocr_text || '',
      };
      await saveContact(payload);
      onSaved();
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Failed to save'));
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Extracted Data</h2>
      <p className="text-sm text-gray-500">Review and edit before saving.</p>
      {data.qr_detected && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          QR code detected — some fields were filled from QR data.
        </p>
      )}

      {/* Editable text fields */}
      {FIELDS.map(({ key, label, required }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={form[key] || ''}
            onChange={e => set(key, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}

      {/* Phone and email fields (comma-separated for multiple values) */}
      {(['phones', 'emails'] as const).map(k => (
        <div key={k}>
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{k} (comma separated)</label>
          <input type="text" value={form[k] || ''} onChange={e => set(k, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      ))}

      {/* Category selector */}
      <CategorySelector result={data.category} value={category} onChange={setCategory} />

      {/* Raw OCR text toggle (for debugging/reference) */}
      {data.raw_ocr_text && (
        <div>
          <button type="button" onClick={() => setShowRaw(r => !r)} className="text-xs text-blue-500 hover:underline">
            {showRaw ? 'Hide' : 'Show'} raw OCR text
          </button>
          {showRaw && <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-32 whitespace-pre-wrap">{data.raw_ocr_text}</pre>}
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onReset} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50">← Scan Another</button>
        <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
          {loading ? 'Saving…' : '💾 Save'}
        </button>
      </div>
    </form>
  );
}
