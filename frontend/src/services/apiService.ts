// API Service for Personal Assistant Backend Integration
// TypeScript version for prompt-reminder-buddy frontend

// Use localhost for local development
const API_BASE_URL = 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  response: string;
  type: string;
  data: T;
}

export interface LogData {
  _id: string;
  text: string;
  time: string;
  date: string;
  originalInput: string;
  createdAt: string;
}

export interface ReminderData {
  _id: string;
  text: string;
  time: string;
  date: string;
  dateWord: string;
  originalTime: string;
  originalInput: string;
  completed: boolean;
  notified: boolean;
  created: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to backend server. Make sure the server is running on http://localhost:3000');
      }
      throw error;
    }
  }

  // Chat API - Main conversational interface
  async sendMessage(message: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Health check
  async getHealth(): Promise<any> {
    return this.request('/health');
  }

  // Get API info
  async getApiInfo(): Promise<any> {
    return this.request('/');
  }

  // Get logs
  async getLogs(filter: string = 'all'): Promise<any> {
    return this.request(`/logs?filter=${filter}`);
  }

  // Get reminders
  async getReminders(): Promise<any> {
    return this.request('/reminders');
  }

  // Dismiss reminder
  async dismissReminder(reminderId: string, method: string = 'manual'): Promise<any> {
    return this.request(`/reminders/${reminderId}/dismiss`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ method }),
    });
  }

  // WebSocket connection for real-time notifications
  connectWebSocket(): WebSocket | null {
    try {
      const wsUrl = 'ws://localhost:3000/ws';
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected to backend');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Handle different message types
          if (data.type === 'reminder_alert') {
            // Trigger browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Reminder Alert', {
                body: data.message,
                icon: '/favicon.ico',
              });
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
