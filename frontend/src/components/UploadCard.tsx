// ============================================================
// UploadCard.tsx — Drag-and-drop file upload area
// ============================================================
// Allows users to click or drag a file to upload.
// Shows image preview after selection.
// ============================================================

import { useRef } from 'react';
import { UPLOAD_ACCEPT } from '../constants';

interface Props { onFileSelect: (f: File) => void; preview: string }

export default function UploadCard({ onFileSelect, preview }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-blue-400 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition"
    >
      {preview ? (
        <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
      ) : (
        <>
          <p className="text-4xl mb-2">📁</p>
          <p className="text-blue-600 font-medium">Click or drag to upload</p>
          <p className="text-sm text-gray-400 mt-1">JPG, PNG, WebP, PDF — max 10MB</p>
        </>
      )}
      <input ref={inputRef} type="file" accept={UPLOAD_ACCEPT} className="hidden" onChange={handleChange} />
    </div>
  );
}
