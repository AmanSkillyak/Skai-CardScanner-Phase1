import { CategoryResult } from '../types';

interface Props {
  result?: CategoryResult;
  value: string;
  onChange: (v: string) => void;
}

const CATEGORIES = [
  'Technology', 'IT & Software', 'Finance', 'Healthcare', 'Education',
  'Retail & E-commerce', 'Marketing & Media', 'Manufacturing', 'Real Estate',
  'Construction', 'Logistics & Transportation', 'Hospitality & Travel',
  'Professional Services', 'Telecommunications', 'Energy & Utilities',
  'Agriculture', 'Government', 'Non-Profit', 'Automotive', 'Food & Beverage', 'Other',
];

export default function CategorySelector({ result, value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">Category</label>
      {result && result.suggested_category && (
        <div className="text-xs text-gray-500 mb-1">
          AI detected: <span className="font-medium text-blue-600">{result.suggested_category}</span>
        </div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Select category…</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}
