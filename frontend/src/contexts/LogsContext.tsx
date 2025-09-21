import React, { createContext, useContext, ReactNode } from 'react';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { DailyLog } from '@/types/dailyLog';

interface LogsContextType {
  logs: DailyLog[];
  loading: boolean;
  deleting: Set<string>;
  addLog: (text: string, category?: DailyLog['category']) => Promise<DailyLog>;
  deleteLog: (id: string) => Promise<void>;
  getTodayLogs: () => DailyLog[];
  getLogsByCategory: (category: DailyLog['category']) => DailyLog[];
  getRecentLogs: (hours?: number) => DailyLog[];
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

interface LogsProviderProps {
  children: ReactNode;
}

export const LogsProvider: React.FC<LogsProviderProps> = ({ children }) => {
  const logsHook = useDailyLogs();

  return (
    <LogsContext.Provider value={logsHook}>
      {children}
    </LogsContext.Provider>
  );
};

export const useLogsContext = (): LogsContextType => {
  const context = useContext(LogsContext);
  if (context === undefined) {
    throw new Error('useLogsContext must be used within a LogsProvider');
  }
  return context;
};
