// API Service for Personal Assistant Backend Integration
import { ChatResponse, HealthResponse, ApiInfo, ApiError } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return data as T;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Chat API - Main conversational interface
  async sendMessage(message: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Get API info
  async getApiInfo(): Promise<ApiInfo> {
    return this.request<ApiInfo>('/');
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
