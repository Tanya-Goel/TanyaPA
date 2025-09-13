// API Service for Personal Assistant Backend Integration
// JavaScript version for compatibility with App.js

// Use your computer's IP address for iOS/Android devices
// This should match your computer's local network IP address
const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
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
  async sendMessage(message) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }

  // Get API info
  async getApiInfo() {
    return this.request('/');
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;