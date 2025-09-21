import { useState, useCallback, useEffect, useRef } from 'react';
import { DailyLog } from '@/types/dailyLog';
import { toast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';

export const useDailyLogs = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const hasFetched = useRef(false);

  // Fetch logs from backend
  const fetchLogs = useCallback(async () => {
    console.log('🔄 Fetching logs from backend...');
    setLoading(true);
    try {
      const data = await apiService.getLogs('all');
      console.log('📊 Received data:', data);
      
      if (data.success && data.data && data.data.logs) {
        const backendLogs: DailyLog[] = [];
        
        // Convert backend logs to frontend format
        // Backend returns logs grouped by date: { "2025-09-20": [...], "2025-09-19": [...] }
        Object.entries(data.data.logs).forEach(([date, logsForDate]: [string, any]) => {
          if (Array.isArray(logsForDate)) {
            logsForDate.forEach((log: any) => {
              backendLogs.push({
                id: log._id,
                text: log.text,
                timestamp: new Date(log.createdAt),
                category: log.category || 'activity',
                createdAt: new Date(log.createdAt),
              });
            });
          }
        });
        
        setLogs(backendLogs);
        console.log('✅ Logs updated:', backendLogs.length, 'logs loaded');
      } else {
        console.log('⚠️ No logs data received or invalid format');
        console.log('Data structure:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
      // Keep existing logs if fetch fails
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite loops

  // Don't auto-fetch on mount to prevent infinite loops
  // Logs will be fetched when component explicitly calls refreshLogs

  const addLog = useCallback(async (text: string, category: DailyLog['category'] = 'activity') => {
    console.log('📝 Adding log:', text, 'category:', category);
    try {
      // Format the log message for the backend
      const logMessage = `Log that I ${text}`;
      console.log('📤 Sending message to backend:', logMessage);
      
      // Send to backend API
      const response = await apiService.sendMessage(logMessage);
      console.log('📥 Backend response:', response);
      
      if (response.type === 'log_created' && response.data) {
        // Convert backend data to frontend format
        const backendLog = response.data as any;
        const newLog: DailyLog = {
          id: backendLog._id || Date.now().toString(),
          text: backendLog.text,
          timestamp: new Date(backendLog.createdAt || Date.now()),
          category,
          createdAt: new Date(backendLog.createdAt || Date.now()),
        };

        // Immediately add to UI for instant feedback
        setLogs(prev => [...prev, newLog]);
        
        toast({
          title: "Activity Logged",
          description: response.response,
        });

        console.log('✅ Log added immediately to UI:', newLog);

        return newLog;
      } else {
        throw new Error('Failed to create log');
      }
    } catch (error) {
      console.error('Error adding log:', error);
      
      // Fallback to local storage
      const newLog: DailyLog = {
        id: Date.now().toString(),
        text,
        timestamp: new Date(),
        category,
        createdAt: new Date(),
      };

      setLogs(prev => [...prev, newLog]);
      
      toast({
        title: "Activity Logged (Local)",
        description: `Logged: "${text}"`,
        variant: "destructive",
      });

      return newLog;
    }
  }, []);

  const deleteLog = useCallback(async (id: string) => {
    // Prevent multiple delete calls for the same log
    if (deleting.has(id)) {
      console.log('⚠️ Delete already in progress for log:', id);
      return;
    }

    console.log('🗑️ Deleting log:', id);
    setDeleting(prev => new Set(prev).add(id));
    
    // Store the log to restore if needed
    const logToDelete = logs.find(l => l.id === id);
    
    // Immediately remove from UI for instant feedback
    setLogs(prev => prev.filter(l => l.id !== id));
    
    try {
      // Call backend API to delete the log
      const response = await fetch(`http://localhost:3000/api/logs/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Log Deleted",
          description: "The activity log has been removed.",
        });
        console.log('✅ Log deleted successfully');
      } else {
        // If backend delete failed, restore the log to local state
        const errorData = await response.json();
        console.error('❌ Backend delete failed:', errorData);
        
        // Restore the log to UI
        if (logToDelete) {
          setLogs(prev => [...prev, logToDelete]);
          console.log('🔄 Log restored to UI after failed delete');
        }
        
        toast({
          title: "Delete Failed",
          description: "Could not delete the log. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error deleting log:', error);
      
      // Restore the log to UI
      if (logToDelete) {
        setLogs(prev => [...prev, logToDelete]);
        console.log('🔄 Log restored to UI after error');
      }
      
      toast({
        title: "Delete Failed",
        description: "Could not delete the log. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, []);

  const getTodayLogs = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return logs.filter(l => 
      l.timestamp >= today && 
      l.timestamp < tomorrow
    );
  }, [logs]);

  const getLogsByCategory = useCallback((category: DailyLog['category']) => {
    return logs.filter(l => l.category === category);
  }, [logs]);

  const getRecentLogs = useCallback((hours: number = 24) => {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    return logs.filter(l => l.timestamp >= cutoff);
  }, [logs]);

  return {
    logs,
    loading,
    deleting,
    addLog,
    deleteLog,
    refreshLogs: fetchLogs,
    getTodayLogs,
    getLogsByCategory,
    getRecentLogs,
  };
};