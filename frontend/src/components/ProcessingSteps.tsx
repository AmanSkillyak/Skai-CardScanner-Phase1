// ============================================================
// ProcessingSteps.tsx — Animated progress indicator
// ============================================================
// Shows the 4 steps of card processing with visual feedback:
// ✓ = completed, pulsing blue = in progress, gray = pending
// ============================================================

import { SCAN_STATUS } from '../constants';

interface Props { status: string }

const STEPS = ['Uploading', 'OCR Processing', 'Extracting Fields', 'Detecting Category'];

export default function ProcessingSteps({ status }: Props) {
  // Determine how many steps are complete based on status
  const active = status === SCAN_STATUS.processing ? 1 : status === SCAN_STATUS.completed ? STEPS.length : 0;

  return (
    <div className="bg-white rounded-2xl shadow p-8 text-center space-y-4">
      <p className="text-lg font-semibold text-gray-700">Processing your card…</p>
      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              i < active ? 'bg-green-500 text-white'                    // Completed
              : i === active ? 'bg-blue-500 text-white animate-pulse'  // In progress
              : 'bg-gray-200 text-gray-400'                            // Pending
            }`}>
              {i < active ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${i <= active ? 'text-gray-800' : 'text-gray-400'}`}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
