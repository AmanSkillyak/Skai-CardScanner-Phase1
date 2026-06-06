import mongoose, { Schema, Document, Types } from 'mongoose';
import { ICategory } from '../types';

export interface ICategoryDocument extends ICategory, Document {}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name:      { type: String, required: true, unique: true },
    keywords:  [{ type: String }],
    is_active: { type: Boolean, default: true },
    parent_id: { type: Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true }
);

export default mongoose.model<ICategoryDocument>('Category', CategorySchema);
