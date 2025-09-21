// Type definitions for Personal Assistant App

export interface Log {
  id: number;
  action: string;
  time: string;
  originalInput: string;
  date: Date;
}

export interface Reminder {
  id: number;
  text: string;
  time: string;
  originalInput: string;
  date: Date;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'log_created' | 'reminder_created' | 'query_response' | 'unknown';
  data?: Log | Reminder | { logs: Log[]; reminders: Reminder[] } | null;
}

export interface ChatResponse {
  response: string;
  type: 'log_created' | 'reminder_created' | 'query_response' | 'unknown';
  data: Log | Reminder | { logs: Log[]; reminders: Reminder[] } | null;
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  storage: string;
  stats: {
    totalLogs: number;
    totalReminders: number;
  };
}

export interface ApiInfo {
  message: string;
  version: string;
  storage: string;
  endpoints: {
    chat: string;
    health: string;
  };
  examples: {
    log: string;
    reminder: string;
    query: string;
  };
  stats: {
    totalLogs: number;
    totalReminders: number;
  };
}

export interface ApiError {
  error: string;
  message?: string;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
  Logs: undefined;
  Reminders: undefined;
};

export type TabParamList = {
  ChatTab: undefined;
  LogsTab: undefined;
  RemindersTab: undefined;
};

// Component prop types
export interface GlassContainerProps {
  children: React.ReactNode;
  style?: any;
  light?: boolean;
  dark?: boolean;
}

export interface GlassButtonProps {
  title: string;
  onPress: () => void;
  style?: any;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent';
}

export interface GlassInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
  multiline?: boolean;
  numberOfLines?: number;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  style?: any;
}

export interface LogCardProps {
  log: Log;
  onDelete?: (id: number) => void;
  style?: any;
}

export interface ReminderCardProps {
  reminder: Reminder;
  onToggle?: (id: number) => void;
  onDelete?: (id: number) => void;
  style?: any;
}

// New types for comprehensive mobile app
export interface ParsedTime {
  time: string | null;
  date: string | null;
  dateWord: string;
  task: string;
}

export interface QuickAction {
  id: string;
  title: string;
  action: () => void;
  color: string;
}

export interface NotificationData {
  id: string | number;
  title: string;
  body: string;
  time: string;
}

export interface MobileLog {
  id: string | number;
  text: string;
  time: string;
  date: string;
}

export interface MobileReminder {
  id: string | number;
  text: string;
  time?: string;
  date: string;
  dateWord: string;
  done: boolean;
  notified: boolean;
  created?: string;
}

export interface QuickActionButtonProps {
  title: string;
  onPress: () => void;
  color: string;
}
