// API Service for Personal Assistant Backend Integration
import { ChatResponse, HealthResponse, ApiInfo, ApiError } from '../types';

// Use your computer's IP address for iOS/Android devices
// This should match your computer's local network IP address
const API_BASE_URL = 'http://192.168.1.3:3000/api';

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

    console.log(`Making API request to: ${url}`);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('API Request failed:', error);
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to backend server. Make sure the server is running on http://192.168.1.3:3000');
      }
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
