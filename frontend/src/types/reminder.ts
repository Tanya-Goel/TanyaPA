export interface Reminder {
  id: string;
  text: string;
  dueTime: Date;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  isCompleted: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  voiceEnabled?: boolean;
  repeatCount?: number;
  snoozeCount?: number;
  lastSnoozedAt?: Date;
  notified?: boolean;
}

export interface NotificationRequest {
  id: string;
  title: string;
  message: string;
  dueTime: Date;
}