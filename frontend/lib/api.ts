import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('gstpro_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('gstpro_token');
      localStorage.removeItem('gstpro_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Typed helpers
export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  // Filter out undefined/null params but keep empty strings (they're valid for search)
  const filteredParams = params
    ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null))
    : undefined;
  const { data } = await api.get<{ success: boolean; data: T }>(url, { params: filteredParams });
  return data.data;
}

export async function apiPost<T>(url: string, body?: unknown) {
  const { data } = await api.post<{ success: boolean; data: T }>(url, body);
  return data.data;
}

export async function apiPut<T>(url: string, body?: unknown) {
  const { data } = await api.put<{ success: boolean; data: T }>(url, body);
  return data.data;
}

export async function apiDelete<T>(url: string) {
  const { data } = await api.delete<{ success: boolean; data: T }>(url);
  return data.data;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function apiGetPaginated<T>(url: string, params?: Record<string, unknown>) {
  const filteredParams = params
    ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null))
    : undefined;
  const { data } = await api.get<{ success: boolean; data: T[]; pagination: PaginatedResponse<T>['pagination'] }>(url, { params: filteredParams });
  return { data: data.data, pagination: data.pagination };
}
