// Offline Reminder Service for Voice Alerts
import textToSpeechService from './textToSpeechService';

interface OfflineReminder {
  id: string;
  text: string;
  dueTime: number; // timestamp
  repeatCount: number;
  snoozeCount: number;
  isCompleted: boolean;
  createdAt: number;
}

class OfflineReminderService {
  private reminders: OfflineReminder[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private isOnline = navigator.onLine;
  private storageKey = 'offline-reminders';

  constructor() {
    this.initializeService();
    this.setupEventListeners();
  }

  // Initialize the offline reminder service
  private initializeService(): void {
    this.loadFromStorage();
    this.startChecking();
    console.log('📱 Offline reminder service initialized');
  }

  // Setup event listeners for online/offline status
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('📱 Back online - syncing reminders');
      this.syncWithServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📱 Gone offline - using local reminders');
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'VOICE_REMINDER') {
          this.handleVoiceReminder(event.data);
        }
      });
    }
  }

  // Load reminders from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.reminders = JSON.parse(stored);
        console.log('📱 Loaded offline reminders:', this.reminders.length);
      }
    } catch (error) {
      console.error('Error loading offline reminders:', error);
      this.reminders = [];
    }
  }

  // Save reminders to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.reminders));
    } catch (error) {
      console.error('Error saving offline reminders:', error);
    }
  }

  // Start checking for due reminders
  private startChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkDueReminders();
    }, 30000); // Check every 30 seconds
  }

  // Check for due reminders and trigger voice alerts
  private checkDueReminders(): void {
    const now = Date.now();
    const dueReminders = this.reminders.filter(
      reminder => !reminder.isCompleted && reminder.dueTime <= now
    );

    dueReminders.forEach(reminder => {
      this.triggerVoiceAlert(reminder);
    });
  }

  // Trigger voice alert for a reminder
  private async triggerVoiceAlert(reminder: OfflineReminder): Promise<void> {
    try {
      console.log('🔊 Triggering offline voice alert:', reminder.text);

      // Speak the reminder
      await textToSpeechService.speakReminder(reminder.text, {
        repeat: true,
        repeatCount: reminder.repeatCount,
        delay: 5000
      });

      // Mark as completed after speaking
      this.markCompleted(reminder.id);

      // Show browser notification as fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Reminder', {
          body: reminder.text,
          icon: '/favicon.ico',
        });
      }
    } catch (error) {
      console.error('Error triggering voice alert:', error);
    }
  }

  // Add a reminder for offline use
  addReminder(text: string, dueTime: Date, repeatCount: number = 1): string {
    const reminder: OfflineReminder = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      dueTime: dueTime.getTime(),
      repeatCount,
      snoozeCount: 0,
      isCompleted: false,
      createdAt: Date.now()
    };

    this.reminders.push(reminder);
    this.saveToStorage();
    console.log('📱 Added offline reminder:', reminder);

    return reminder.id;
  }

  // Snooze a reminder
  snoozeReminder(id: string, minutes: number): boolean {
    const reminder = this.reminders.find(r => r.id === id);
    if (!reminder) return false;

    reminder.dueTime = Date.now() + (minutes * 60 * 1000);
    reminder.snoozeCount++;
    this.saveToStorage();

    console.log('📱 Snoozed offline reminder:', id, 'for', minutes, 'minutes');
    return true;
  }

  // Mark reminder as completed
  markCompleted(id: string): boolean {
    const reminder = this.reminders.find(r => r.id === id);
    if (!reminder) return false;

    reminder.isCompleted = true;
    this.saveToStorage();

    console.log('📱 Marked offline reminder as completed:', id);
    return true;
  }

  // Remove a reminder
  removeReminder(id: string): boolean {
    const index = this.reminders.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.reminders.splice(index, 1);
    this.saveToStorage();

    console.log('📱 Removed offline reminder:', id);
    return true;
  }

  // Get all reminders
  getAllReminders(): OfflineReminder[] {
    return [...this.reminders];
  }

  // Get pending reminders
  getPendingReminders(): OfflineReminder[] {
    return this.reminders.filter(r => !r.isCompleted);
  }

  // Get today's reminders
  getTodayReminders(): OfflineReminder[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.reminders.filter(r => {
      const reminderDate = new Date(r.dueTime);
      return reminderDate >= today && 
             reminderDate < tomorrow && 
             !r.isCompleted;
    });
  }

  // Sync with server when online
  private async syncWithServer(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // This would sync with the main reminder system
      // For now, we'll just log that sync would happen
      console.log('📱 Would sync offline reminders with server');
      
      // Clear completed reminders after sync
      this.reminders = this.reminders.filter(r => !r.isCompleted);
      this.saveToStorage();
    } catch (error) {
      console.error('Error syncing offline reminders:', error);
    }
  }

  // Handle voice reminder from service worker
  private handleVoiceReminder(data: { text: string; repeatCount: number }): void {
    console.log('📱 Received voice reminder from service worker:', data);
    
    // Trigger voice alert immediately
    textToSpeechService.speakReminder(data.text, {
      repeat: true,
      repeatCount: data.repeatCount,
      delay: 2000
    }).catch(error => {
      console.error('Error speaking service worker reminder:', error);
    });
  }

  // Check if service is supported
  isSupported(): boolean {
    return textToSpeechService.isServiceSupported();
  }

  // Get service status
  getStatus(): {
    isOnline: boolean;
    reminderCount: number;
    pendingCount: number;
    isSupported: boolean;
  } {
    return {
      isOnline: this.isOnline,
      reminderCount: this.reminders.length,
      pendingCount: this.getPendingReminders().length,
      isSupported: this.isSupported()
    };
  }

  // Clean up old completed reminders
  cleanup(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.reminders = this.reminders.filter(r => 
      !r.isCompleted || r.createdAt > oneWeekAgo
    );
    this.saveToStorage();
    console.log('📱 Cleaned up old offline reminders');
  }

  // Destroy the service
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('📱 Offline reminder service destroyed');
  }
}

// Create singleton instance
const offlineReminderService = new OfflineReminderService();

export default offlineReminderService;
