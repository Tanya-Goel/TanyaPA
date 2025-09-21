import React, { createContext, useContext, ReactNode } from 'react';
import { useReminders } from '@/hooks/useReminders';
import { Reminder } from '@/types/reminder';

interface RemindersContextType {
  reminders: Reminder[];
  loading: boolean;
  deleting: Set<string>;
  addReminder: (text: string, dueTime: Date, priority?: 'low' | 'medium' | 'high', voiceSettings?: { voiceEnabled?: boolean; repeatCount?: number }) => Promise<Reminder>;
  deleteReminder: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  snoozeReminder: (id: string, minutes: number) => Promise<void>;
  fetchReminders: () => Promise<void>;
  getPendingReminders: () => Reminder[];
  getTodayReminders: () => Reminder[];
}

const RemindersContext = createContext<RemindersContextType | undefined>(undefined);

interface RemindersProviderProps {
  children: ReactNode;
}

export const RemindersProvider: React.FC<RemindersProviderProps> = ({ children }) => {
  const remindersHook = useReminders();
  
  // Debug logging
  console.log('🔔 RemindersProvider - Hook state:', {
    remindersCount: remindersHook.reminders.length,
    loading: remindersHook.loading,
    hasFetchReminders: typeof remindersHook.fetchReminders === 'function'
  });

  return (
    <RemindersContext.Provider value={remindersHook}>
      {children}
    </RemindersContext.Provider>
  );
};

export const useRemindersContext = (): RemindersContextType => {
  const context = useContext(RemindersContext);
  if (context === undefined) {
    throw new Error('useRemindersContext must be used within a RemindersProvider');
  }
  return context;
};
