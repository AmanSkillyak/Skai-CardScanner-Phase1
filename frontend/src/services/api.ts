import axios from 'axios';
import {
  Contact,
  ContactListParams,
  ContactSavePayload,
  ContactUpdatePayload,
  ExportFormat,
  ScanCardResponse,
} from '../types';
import { API_BASE_PATH, API_ENDPOINTS } from '../constants';

const api = axios.create({ baseURL: API_BASE_PATH });

// --- Scan ---
export const scanCard = (formData: FormData) =>
  api.post<ScanCardResponse>(API_ENDPOINTS.scans, formData);

// --- Contacts CRUD ---
export const saveContact   = (data: ContactSavePayload) => api.post(API_ENDPOINTS.contacts, data);
export const getContacts   = (params?: ContactListParams) => api.get<Contact[]>(API_ENDPOINTS.contacts, { params });
export const updateContact = (id: string, data: ContactUpdatePayload) => api.put<Contact>(`${API_ENDPOINTS.contacts}/${id}`, data);
export const deleteContact = (id: string) => api.delete(`${API_ENDPOINTS.contacts}/${id}`);

// --- Export ---
export const exportContacts = (format: ExportFormat, ids?: string[]) =>
  api.post(API_ENDPOINTS.exports, { format, ids }, { responseType: 'blob' });
