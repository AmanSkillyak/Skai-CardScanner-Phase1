// ============================================================
// ScanCard.tsx — Main scanning page
// ============================================================
// This is the landing page where users:
// 1. Upload an image/PDF or capture via camera
// 2. Click "Scan Card" to trigger OCR
// 3. See processing animation
// 4. Review extracted data in an editable form
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExtractedCard, ScanStatus } from '../types';
import { scanCard } from '../services/api';
import UploadCard from '../components/UploadCard';
import CameraCapture from '../components/CameraCapture';
import CardForm from '../components/CardForm';
import ProcessingSteps from '../components/ProcessingSteps';
import { SCAN_STATUS } from '../constants';
import { extractApiErrorMessage } from '../utils/apiError';

export default function ScanCard() {
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState('');
  const [showCam, setShowCam]       = useState(false);
  const [scanning, setScanning]     = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>(SCAN_STATUS.processing);
  const [extracted, setExtracted]   = useState<ExtractedCard | null>(null);
  const [error, setError]           = useState('');
  const navigate = useNavigate();

  // Handle file selection from upload component
  const handleFileSelect = (f: File) => {
    setFile(f); setError('');
    if (preview) URL.revokeObjectURL(preview); // Prevent memory leak
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
  };

  // Handle photo captured from camera
  const handleCapture = (f: File, src: string) => {
    setFile(f); setPreview(src); setShowCam(false);
  };

  // Main scan flow: upload file → OCR → parse → categorize
  const handleScan = async () => {
    if (!file) return setError('Please upload or capture a card first');
    setScanning(true); setError(''); setScanStatus(SCAN_STATUS.processing);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await scanCard(formData);
      setScanStatus(SCAN_STATUS.completed);
      setExtracted(data.result);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'OCR failed. Please try a clearer image.'));
    } finally {
      setScanning(false);
    }
  };

  // Reset everything to scan another card
  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(''); setExtracted(null); setError('');
  };

  // --- Render: Processing animation ---
  if (scanning) return <div className="max-w-lg mx-auto py-8 px-4"><ProcessingSteps status={scanStatus} /></div>;

  // --- Render: Editable review form (after successful scan) ---
  if (extracted) return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <CardForm data={extracted} onSaved={() => navigate('/records')} onReset={handleReset} />
    </div>
  );

  // --- Render: Upload/Camera selection (default state) ---
  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600">Visiting Card Scanner</h1>
        <p className="text-gray-500 mt-1 text-sm">Upload or capture a business card to extract contact info</p>
      </div>

      <UploadCard onFileSelect={handleFileSelect} preview={preview} />

      <div className="flex items-center gap-3">
        <hr className="flex-1 border-gray-200" /><span className="text-gray-400 text-sm">OR</span><hr className="flex-1 border-gray-200" />
      </div>

      <button onClick={() => setShowCam(true)}
        className="w-full border-2 border-blue-300 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-50 transition">
        📷 Open Camera
      </button>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      <button onClick={handleScan} disabled={!file}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-40 transition">
        🔍 Scan Card
      </button>

      {showCam && <CameraCapture onCapture={handleCapture} onClose={() => setShowCam(false)} />}
    </div>
  );
}
