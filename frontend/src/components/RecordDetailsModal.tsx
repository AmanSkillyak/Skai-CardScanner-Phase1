// ============================================================
// RecordDetailsModal.tsx — Full contact details popup
// ============================================================
// Shows all fields of a saved contact in a modal overlay.
// Displayed when user clicks "View" on a record in the table.
// ============================================================

import { Contact } from '../types';

interface Props { card: Contact | null; onClose: () => void }

export default function RecordDetailsModal({ card, onClose }: Props) {
  if (!card) return null;

  const rows: [string, string | undefined][] = [
    ['Name', card.person_name],
    ['Designation', card.designation],
    ['Company', card.company_name],
    ['Phone', card.phones?.join(', ')],
    ['Email', card.emails?.join(', ')],
    ['Website', card.website],
    ['Category', card.category],
    ['Address', card.address?.raw],
    ['Saved On', new Date(card.createdAt).toLocaleDateString()],
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4">Card Details</h3>
        <dl className="space-y-2">
          {rows.map(([label, value]) => value && (
            <div key={label} className="flex gap-2 text-sm">
              <dt className="font-medium text-gray-500 w-24 shrink-0">{label}</dt>
              <dd className="text-gray-800 break-all">{value}</dd>
            </div>
          ))}
        </dl>
        {card.cardImage && <img src={card.cardImage} alt="card" className="mt-4 w-full rounded-lg border" />}
        <button onClick={onClose} className="mt-5 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Close</button>
      </div>
    </div>
  );
}
