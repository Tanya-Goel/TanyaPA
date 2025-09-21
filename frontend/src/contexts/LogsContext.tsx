import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { DailyLog } from '@/types/dailyLog';

interface LogsContextType {
  logs: DailyLog[];
  loading: boolean;
  deleting: Set<string>;
  addLog: (text: string, category?: DailyLog['category']) => Promise<DailyLog>;
  deleteLog: (id: string) => Promise<void>;
  refreshLogs: () => Promise<void>;
  getTodayLogs: () => DailyLog[];
  getLogsByCategory: (category: DailyLog['category']) => DailyLog[];
  getRecentLogs: (hours?: number) => DailyLog[];
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

interface LogsProviderProps {
  children: ReactNode;
}

export function LogsProvider({ children }: LogsProviderProps) {
  const logsHook = useDailyLogs();
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => logsHook, [logsHook]);
  
  // Debug logging
  console.log('📝 LogsProvider - Hook state:', {
    logsCount: logsHook.logs.length,
    loading: logsHook.loading,
    hasRefreshLogs: typeof logsHook.refreshLogs === 'function'
  });

  return (
    <LogsContext.Provider value={contextValue}>
      {children}
    </LogsContext.Provider>
  );
}

export function useLogsContext(): LogsContextType {
  const context = useContext(LogsContext);
  if (context === undefined) {
    throw new Error('useLogsContext must be used within a LogsProvider');
  }
  return context;
}
