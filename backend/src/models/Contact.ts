import mongoose, { Schema, Document, Types } from 'mongoose';
import { IContact } from '../types';

export interface IContactDocument extends IContact, Document {}

const ContactSchema = new Schema<IContactDocument>(
  {
    person_name:           { type: String, required: true },
    designation:           { type: String },
    company_name:          { type: String },
    phones:                [{ type: String }],
    emails:                [{ type: String }],
    website:               { type: String },
    address: {
      raw:     { type: String },
      city:    { type: String },
      state:   { type: String },
      pincode: { type: String },
    },
    social_links:          { type: Map, of: String },
    gstin_or_tax_id:       { type: String },
    raw_ocr_text:          { type: String },
    extraction_confidence: { type: Number },
    cardImage:             { type: String },
    scan_id:               { type: Types.ObjectId, ref: 'Scan' },
    category:              { type: String },
    keywords:              [{ type: String }],
  },
  { timestamps: true }
);

ContactSchema.index({ emails: 1 });
ContactSchema.index({ phones: 1 });

export default mongoose.model<IContactDocument>('Contact', ContactSchema);
