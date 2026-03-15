import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { B2B_API_BASE_URL } from '../config/endpoints';

export type B2BApiError = {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
};

type TokenProvider = () => string | null | undefined;

let tokenProvider: TokenProvider | undefined;

export const setB2BAuthTokenProvider = (provider: TokenProvider) => {
  tokenProvider = provider;
};

const createInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = tokenProvider?.();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const apiError: B2BApiError = {
        message: (error.response?.data as any)?.message || error.message,
        status: error.response?.status,
        code: (error.response?.data as any)?.code,
        details: error.response?.data as any,
      };
      return Promise.reject(apiError);
    }
  );

  return instance;
};

class B2BHttpClient {
  private instance: AxiosInstance;

  constructor(baseURL: string = B2B_API_BASE_URL) {
    this.instance = createInstance(baseURL);
  }

  public withBaseUrl(baseURL: string) {
    this.instance = createInstance(baseURL);
  }

  public async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.get(url, config);
    return response.data;
  }

  public async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.post(url, data, config);
    return response.data;
  }

  public async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.put(url, data, config);
    return response.data;
  }

  public async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.patch(url, data, config);
    return response.data;
  }

  public async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.delete(url, config);
    return response.data;
  }
}

export const httpClient = new B2BHttpClient();
