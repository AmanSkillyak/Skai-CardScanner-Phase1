import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Contact, ContactUpdatePayload, ExportFormat } from '../types';
import { getContacts, deleteContact, updateContact, exportContacts } from '../services/api';
import RecordDetailsModal from '../components/RecordDetailsModal';

export default function Records() {
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Contact | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editData, setEditData]   = useState<Partial<Contact>>({});
  const [search, setSearch]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search: wait 400ms after user stops typing before fetching
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetch = async () => {
    try { const { data } = await getContacts({ search: debouncedSearch || undefined }); setContacts(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    await deleteContact(id);
    setContacts(c => c.filter(x => x._id !== id));
    setDeleteId(null);
  };

  const startEdit = (c: Contact) => {
    setEditId(c._id);
    setEditData({ person_name: c.name || c.person_name, company_name: c.companyName || c.company_name, category: c.category });
  };

  const saveEdit = async (id: string) => {
    const payload: ContactUpdatePayload = {};
    if (editData.person_name) payload.name = editData.person_name;
    if (editData.company_name) payload.companyName = editData.company_name;
    if (editData.category) payload.category = editData.category;
    const { data } = await updateContact(id, payload);
    setContacts(c => c.map(x => x._id === id ? data : x));
    setEditId(null);
  };

  const handleExport = async (format: ExportFormat) => {
    const { data } = await exportContacts(format);
    const url = URL.createObjectURL(data as Blob);
    const a = document.createElement('a'); a.href = url; a.download = `contacts.${format}`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Saved Records</h1>
        <div className="flex gap-2 flex-wrap">
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => handleExport('csv')} className="border border-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">CSV</button>
          <button onClick={() => handleExport('xlsx')} className="border border-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">XLSX</button>
          <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Scan New</Link>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-20 text-gray-400"><p className="text-5xl mb-3">📭</p><p>No records found.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm bg-white">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>{['Name','Company','Category','Email','Phone','Date','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.map(c => (
                <tr key={c._id} className="hover:bg-gray-50">
                  {editId === c._id ? (
                    <>
                      {(['person_name','company_name','category'] as const).map(k => (
                        <td key={k} className="px-4 py-2">
                          <input value={editData[k] || ''} onChange={e => setEditData(d => ({ ...d, [k]: e.target.value }))}
                            className="w-full border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none" />
                        </td>
                      ))}
                      <td className="px-4 py-2 text-gray-400 text-xs" colSpan={3}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(c._id)} className="text-green-600 hover:underline text-xs font-medium">Save</button>
                          <button onClick={() => setEditId(null)} className="text-gray-400 hover:underline text-xs">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-800">{c.name || c.person_name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.companyName || c.company_name || '—'}</td>
                      <td className="px-4 py-3">
                        {c.category && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{c.category}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.email || c.emails?.[0] || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{c.phone || c.phones?.[0] || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => setSelected(c)} className="text-blue-600 hover:underline text-xs">View</button>
                          <button onClick={() => startEdit(c)} className="text-yellow-600 hover:underline text-xs">Edit</button>
                          <button onClick={() => setDeleteId(c._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <RecordDetailsModal card={selected} onClose={() => setSelected(null)} />}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <p className="text-4xl mb-3">🗑️</p>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Record?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
