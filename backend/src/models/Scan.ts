import mongoose, { Schema, Document } from 'mongoose';
import { IScan } from '../types';
import { SCAN_RETENTION_MS, SCAN_STATUS, SCAN_STATUSES } from '../constants';

export interface IScanDocument extends IScan, Document {}

const ScanSchema = new Schema<IScanDocument>(
  {
    user_id:       { type: String, default: null },
    workspace_id:  { type: String, default: null },
    input_type:    { type: String, enum: ['image', 'pdf'], required: true },
    file_path:     { type: String, required: true },
    status:        { type: String, enum: SCAN_STATUSES, default: SCAN_STATUS.pending },
    error_message: { type: String },
    expires_at:    { type: Date, default: () => new Date(Date.now() + SCAN_RETENTION_MS) },
    processedAt:   { type: Date },
    result:         { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ScanSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IScanDocument>('Scan', ScanSchema);
