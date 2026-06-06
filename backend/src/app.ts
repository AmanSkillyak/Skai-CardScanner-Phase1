import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db';
import { errorHandler } from './middleware/errorHandler';
import scanRoutes     from './routes/scan.routes';
import contactRoutes  from './routes/contact.routes';
import categoryRoutes from './routes/category.routes';
import exportRoutes   from './routes/export.routes';
import Category from './models/Category';
import { API_PATHS, LOCAL_CORS_ORIGINS } from './constants';
import { rejectUnsafeKeys } from './middleware/sanitize';

export const app = express();

const normalizeCorsOrigin = (origin: string): string => origin.trim().replace(/\/+$/, '');

const configuredCorsOrigins = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS;

const corsOrigins = (configuredCorsOrigins ? configuredCorsOrigins.split(',') : LOCAL_CORS_ORIGINS)
  .map(normalizeCorsOrigin)
  .filter(Boolean);

const corsOriginMatches = (origin: string): boolean =>
  corsOrigins.some(allowedOrigin => {
    if (allowedOrigin === '*') return true;
    if (!allowedOrigin.includes('*')) return allowedOrigin === origin;

    const pattern = allowedOrigin
      .split('*')
      .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return new RegExp(`^${pattern}$`).test(origin);
  });

app.use(cors({
  origin: (origin, cb) => {
    const normalizedOrigin = origin ? normalizeCorsOrigin(origin) : '';

    if (!normalizedOrigin || corsOriginMatches(normalizedOrigin)) {
      cb(null, true);
      return;
    }
    console.warn(`CORS rejected origin: ${origin}`);
    cb(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());
app.use(rejectUnsafeKeys);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get(API_PATHS.health, (_req, res) => res.json({ status: 'ok' }));
app.use(API_PATHS.scans,      scanRoutes);
app.use(API_PATHS.contacts,   contactRoutes);
app.use(API_PATHS.categories, categoryRoutes);
app.use(API_PATHS.exports,    exportRoutes);
app.use(errorHandler);

const SEED_CATEGORIES = [
  { name: 'Electrical Wires Supplier',       keywords: ['wires','cables','electricals','copper','switches','mcb','led','lighting'] },
  { name: 'Corporate Gifts Supplier',         keywords: ['gifts','promotional','branding','trophies','hampers','merchandise'] },
  { name: 'Printing and Packaging',           keywords: ['printing','box','packaging','offset','label','carton'] },
  { name: 'IT Services and Software',         keywords: ['software','website','app','erp','crm','cloud','it services','tech'] },
  { name: 'Digital Marketing Agency',         keywords: ['seo','social media','ads','branding','marketing'] },
  { name: 'Real Estate and Construction',     keywords: ['builders','construction','architect','interior','contractor','property'] },
  { name: 'Logistics and Transport',          keywords: ['logistics','courier','transport','freight','cargo','warehouse'] },
  { name: 'Manufacturing',                    keywords: ['manufacturer','factory','production','oem','machinery','industrial'] },
  { name: 'Wholesale Trader / Distributor',   keywords: ['dealer','distributor','wholesaler','trading','stockist'] },
  { name: 'Finance and Accounting',           keywords: ['ca','accountant','tax','gst','finance','loan','insurance'] },
  { name: 'Healthcare and Medical',           keywords: ['clinic','hospital','pharma','medical','doctor','diagnostics'] },
  { name: 'Education and Training',           keywords: ['school','institute','academy','coaching','training','college'] },
  { name: 'Food and Hospitality',             keywords: ['restaurant','catering','hotel','bakery','food'] },
  { name: 'Textile and Garments',             keywords: ['textile','garments','fabric','apparel','clothing','uniform'] },
  { name: 'Security Services',                keywords: ['security','cctv','guard','surveillance','access control'] },
];

const seedCategories = async () => {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany(SEED_CATEGORIES.map(c => ({ ...c, is_active: true })));
    console.log('Categories seeded');
  }
};

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => seedCategories())
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
}

export default app;
