import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

console.log("BASE_URL:", BASE_URL);
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request — adiciona JWT automaticamente
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Interceptor de response — trata erros globais
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ message?: string }>) => {
    console.log("API Error:", error.response);
    if (error.response?.status === 401) {
      // Token expirado ou inválido — limpa o storage
      await SecureStore.deleteItemAsync('auth_token');
      // O AuthStore vai perceber ausência de token na próxima verificação
    }
    return Promise.reject(error);
  }
);

export default api;
