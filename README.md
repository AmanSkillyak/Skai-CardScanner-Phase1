# Skai CardScanner

Skai CardScanner is a TypeScript full-stack app for scanning visiting cards, extracting contact details, reviewing the extracted data, saving contacts, and exporting saved records.

## Current Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB, Mongoose |
| OCR | Tesseract.js by default, selected with `OCR_PROVIDER` |
| AI category suggestion | Groq API with fallback when `GROQ_API_KEY` is not set |
| Exports | CSV and XLSX |

## Project Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── uploads/
│   ├── dist/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
└── docs/
```

The canonical backend application lives in `backend/src/` and builds to `backend/dist/`.

## Prerequisites

- Node.js 18 or newer
- MongoDB available through `MONGODB_URI`
- Optional Groq API key for AI category suggestions

## Environment

Copy `backend/.env.example` to `backend/.env` and set values for your environment.

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/skai-cardscanner
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
OCR_PROVIDER=tesseract
GROQ_API_KEY=
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
```

## Install

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Run Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` and `/uploads` to `http://localhost:5000`.

## Build And Start

Build the backend:

```bash
cd backend
npm run build
npm start
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Verification Commands

```bash
cd backend
npm test
npm run build

cd ../frontend
npm test
npm run build
```

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/scans` | Upload a card and start scan processing |
| `GET` | `/api/scans/:id/status` | Read scan status |
| `GET` | `/api/scans/:id/result` | Read scan result |
| `POST` | `/api/contacts` | Save a contact |
| `GET` | `/api/contacts` | List contacts |
| `GET` | `/api/contacts/:id` | Read one contact |
| `PUT` | `/api/contacts/:id` | Update a contact |
| `DELETE` | `/api/contacts/:id` | Delete a contact |
| `GET` | `/api/categories` | List categories |
| `POST` | `/api/categories/suggest` | Suggest a category |
| `POST` | `/api/exports` | Export contacts as CSV or XLSX |

## License

ISC
