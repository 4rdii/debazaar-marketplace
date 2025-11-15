import axios from 'axios';
import type { Listing, Order, UserProfile, TransactionData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token management
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  localStorage.setItem('auth_token', token);
};

export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
  localStorage.removeItem('auth_token');
};

// Listings API
export const listingsAPI = {
  getAll: (params?: any) => api.get<Listing[]>('/listings/', { params }),
  getById: (id: number) => api.get<Listing>(`/listings/${id}/`),
  create: (data: any) => api.post<Listing>('/listings/', data),
  delete: (id: number) => api.delete(`/listings/${id}/delete/`),
  createTransaction: (data: any) => api.post<TransactionData>('/listings/create-transaction/', data),
  confirmTransaction: (id: number, data: any) => api.post(`/listings/${id}/confirm-transaction/`, data),
  finalize: (id: number, data: any) => api.post(`/listings/${id}/finalize/`, data),
};

// Orders API
export const ordersAPI = {
  getById: (id: number) => api.get<Order>(`/orders/${id}/`),
  create: (data: any) => api.post<Order>('/orders/', data),
  approveToken: (data: any) => api.post<TransactionData>('/orders/approve-token-transaction/', data),
  purchaseTransaction: (data: any) => api.post<TransactionData>('/orders/purchase-transaction/', data),
  confirmPurchase: (id: number, data: any) => api.post(`/orders/${id}/confirm-purchase/`, data),
  deliverTransaction: (id: number, data: any) => api.post<TransactionData>(`/orders/${id}/deliver-transaction/`, data),
  confirmDelivery: (id: number, data: any) => api.post(`/orders/${id}/confirm-delivery-transaction/`, data),
  acceptTransaction: (id: number) => api.post<TransactionData>(`/orders/${id}/accept-transaction/`),
  confirmAcceptance: (id: number, data: any) => api.post(`/orders/${id}/confirm-acceptance/`, data),
  disputeTransaction: (id: number) => api.post<TransactionData>(`/orders/${id}/dispute-transaction/`),
  confirmDispute: (id: number, data: any) => api.post(`/orders/${id}/confirm-dispute/`, data),
};

// Auth API
export const authAPI = {
  wallet: (data: { wallet_address: string; signature: string }) =>
    api.post('/auth/wallet/', data),
};

// Upload API
export const uploadAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
