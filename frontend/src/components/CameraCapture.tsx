// ============================================================
// CameraCapture.tsx — Webcam capture modal
// ============================================================
// Opens a fullscreen modal with the device camera.
// User can capture a photo, preview it, retake, or confirm.
// ============================================================

import { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { CAMERA_CAPTURE_MIME_TYPE } from '../constants';

interface Props { onCapture: (file: File, preview: string) => void; onClose: () => void }

export default function CameraCapture({ onCapture, onClose }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  // Take a screenshot from the webcam
  const capture = useCallback(() => {
    const src = webcamRef.current?.getScreenshot();
    if (src) setCaptured(src);
  }, []);

  // Convert the captured base64 image to a File and pass it up
  const confirm = () => {
    if (!captured) return;
    fetch(captured).then(r => r.blob()).then(blob => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: CAMERA_CAPTURE_MIME_TYPE });
      onCapture(file, captured);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4 text-center">Capture Card</h3>
        {!captured ? (
          <>
            <Webcam ref={webcamRef} screenshotFormat={CAMERA_CAPTURE_MIME_TYPE} className="w-full rounded-lg"
              videoConstraints={{ facingMode: 'environment' }} />
            <button onClick={capture} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
              📷 Capture
            </button>
          </>
        ) : (
          <>
            <img src={captured} alt="captured" className="w-full rounded-lg" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setCaptured(null)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">Retake</button>
              <button onClick={confirm} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Use Photo</button>
            </div>
          </>
        )}
        <button onClick={onClose} className="mt-3 w-full text-gray-500 text-sm hover:text-gray-700">Cancel</button>
      </div>
    </div>
  );
}
