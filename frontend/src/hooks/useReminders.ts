import { useState, useEffect, useCallback, useRef } from 'react';
import { Reminder, NotificationRequest } from '@/types/reminder';
import { toast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';
import pushNotificationService from '@/services/pushNotificationService';
import textToSpeechService from '@/services/textToSpeechService';

export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<NotificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const hasFetched = useRef(false);

  // Fetch reminders from backend
  const fetchReminders = useCallback(async () => {
    console.log('🔄 Fetching reminders from backend...');
    setLoading(true);
    try {
      const data = await apiService.getReminders('active'); // Use 'active' filter
      console.log('📊 Received reminders data:', data);
      console.log('📊 Pending reminders from backend:', data.data?.pending?.length || 0);
      console.log('📊 Completed reminders from backend:', data.data?.completed?.length || 0);

      if (data && data.success && data.data) {
        const backendReminders: Reminder[] = [];
        
        console.log('🔔 Raw backend data:', data.data);
        console.log('🔔 Pending reminders from backend:', data.data.pending);
        
        // Parse pending reminders (only process if status is actually pending)
        if (data.data.pending && Array.isArray(data.data.pending)) {
          data.data.pending.forEach((reminder: any) => {
            // Double-check: only process if status is actually pending
            if (reminder.status === 'completed') {
              console.log('⚠️ Skipping completed reminder that was incorrectly returned as pending:', reminder.text);
              return;
            }
            // Handle different date formats from backend
            let dueTime: Date;
            if (reminder.datetime) {
              dueTime = new Date(reminder.datetime);
            } else if (reminder.date) {
              // Handle string date format from backend
              dueTime = new Date(reminder.date);
            } else {
              // Fallback to current time if no date found
              dueTime = new Date();
            }
            
            // Validate the date
            if (isNaN(dueTime.getTime())) {
              console.warn('Invalid date for reminder:', reminder._id, 'date:', reminder.date, 'datetime:', reminder.datetime);
              dueTime = new Date(); // Fallback to current time
            }
            
            // Only add if it's not too old (within last 7 days)
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            
            if (dueTime >= oneWeekAgo) {
              backendReminders.push({
                id: reminder._id,
                text: reminder.text,
                dueTime: dueTime,
                isRecurring: false,
                isCompleted: reminder.status === 'completed',
                createdAt: new Date(reminder.createdAt || Date.now()),
                priority: 'medium' as const,
                notified: reminder.notified || false,
              });
            } else {
              console.log('🔔 Skipping old pending reminder:', reminder.text, 'dueTime:', dueTime);
            }
          });
        }
        
        // Parse completed reminders (only recent ones) - but for 'active' filter, this should be empty
        if (data.data.completed && Array.isArray(data.data.completed)) {
          console.log('⚠️ Received completed reminders with active filter - this should not happen');
          data.data.completed.forEach((reminder: any) => {
            // Handle different date formats from backend
            let dueTime: Date;
            if (reminder.datetime) {
              dueTime = new Date(reminder.datetime);
            } else if (reminder.date) {
              // Handle string date format from backend
              dueTime = new Date(reminder.date);
            } else {
              // Fallback to current time if no date found
              dueTime = new Date();
            }
            
            // Validate the date
            if (isNaN(dueTime.getTime())) {
              console.warn('Invalid date for reminder:', reminder._id, 'date:', reminder.date, 'datetime:', reminder.datetime);
              dueTime = new Date(); // Fallback to current time
            }
            
            // Only add completed reminders from the last 7 days
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            
            if (dueTime >= oneWeekAgo) {
              backendReminders.push({
                id: reminder._id,
                text: reminder.text,
                dueTime: dueTime,
                isRecurring: false,
                isCompleted: reminder.status === 'completed',
                createdAt: new Date(reminder.createdAt || Date.now()),
                priority: 'medium' as const,
                notified: reminder.notified || false,
              });
            } else {
              console.log('🔔 Skipping old completed reminder:', reminder.text, 'dueTime:', dueTime);
            }
          });
        }
        
        // Sort reminders by creation date (most recent first)
        const sortedReminders = backendReminders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // CRITICAL FIX: Merge with existing local state instead of replacing
        // This prevents newly created reminders from being lost during auto-refresh
        setReminders(prevReminders => {
          // Create a map of existing reminders by ID for quick lookup
          const existingRemindersMap = new Map(prevReminders.map(r => [r.id, r]));
          
          // Merge backend reminders with existing local reminders
          const mergedReminders: Reminder[] = [];
          
          // Add all backend reminders
          sortedReminders.forEach(backendReminder => {
            mergedReminders.push(backendReminder);
          });
          
          // Add any local reminders that aren't in the backend response
          // This preserves newly created reminders that might not be in backend yet
          prevReminders.forEach(localReminder => {
            if (!existingRemindersMap.has(localReminder.id) || 
                !sortedReminders.some(br => br.id === localReminder.id)) {
              // Only add if it's a recent reminder (created within last 5 minutes)
              // This prevents old stale local reminders from persisting
              const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
              if (new Date(localReminder.createdAt) > fiveMinutesAgo) {
                console.log('🔔 Preserving local reminder not yet in backend:', localReminder.id);
                mergedReminders.push(localReminder);
              }
            }
          });
          
          // Sort the merged list by creation date (most recent first)
          const finalSorted = mergedReminders.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          console.log('✅ Reminders merged:', {
            backendCount: sortedReminders.length,
            localCount: prevReminders.length,
            finalCount: finalSorted.length,
            preserved: finalSorted.length - sortedReminders.length
          });
          
          return finalSorted;
        });
        
        console.log('✅ Reminders updated:', sortedReminders.length, 'reminders loaded from backend');
        if (sortedReminders.length > 0) {
          console.log('📋 Most recent backend reminder:', sortedReminders[0]);
          console.log('📋 All backend reminder IDs:', sortedReminders.map(r => r.id));
        } else {
          console.log('⚠️ No reminders found in backend response');
        }
      } else {
        console.log('⚠️ No reminders data received');
      }
    } catch (error) {
      console.error('❌ Error fetching reminders:', error);
      // Don't clear existing reminders on error - keep local state intact
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch reminders when the hook is first used (app starts)
  useEffect(() => {
    console.log('🔔 useReminders useEffect - hasFetched:', hasFetched.current);
    if (!hasFetched.current) {
      console.log('🔔 useReminders - First time, fetching reminders...');
      hasFetched.current = true;
      fetchReminders();
    } else {
      console.log('🔔 useReminders - Already fetched, skipping...');
    }
  }, [fetchReminders]);

  // Auto-refresh reminders every 60 seconds to catch triggered reminders (reduced frequency)
  // This prevents too frequent refreshes that could interfere with newly created reminders
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasFetched.current) {
        console.log('🔄 Auto-refreshing reminders...');
        fetchReminders();
      }
    }, 60000); // Refresh every 60 seconds (reduced from 30 seconds)

    return () => clearInterval(interval);
  }, [fetchReminders]);

  // Initialize push notifications on first load
  useEffect(() => {
    const initializePushNotifications = async () => {
      if (pushNotificationService.isSupported()) {
        try {
          await pushNotificationService.initializeServiceWorker();
          const hasPermission = await pushNotificationService.hasPermission();
          
          if (hasPermission) {
            console.log('🔔 Push notifications enabled');
            toast({
              title: "Push Notifications Enabled",
              description: "You'll receive reminders even when the app is closed!",
            });
          } else {
            console.log('🔔 Push notifications not enabled');
          }
        } catch (error) {
          console.error('🔔 Error initializing push notifications:', error);
        }
      } else {
        console.log('🔔 Push notifications not supported in this browser');
      }
    };

    initializePushNotifications();
  }, []);

  // Note: Reminder checking is now handled by VoiceReminderManager via WebSocket
  // This prevents duplicate processing and ensures real-time notifications

  const addReminder = useCallback(async (text: string, dueTime: Date, priority: 'low' | 'medium' | 'high' = 'medium', voiceSettings?: { voiceEnabled?: boolean; repeatCount?: number }) => {
    try {
      // Check for repeat count in the text
      const repeatMatch = text.match(/(\d+)\s*times?/i);
      const detectedRepeatCount = repeatMatch ? parseInt(repeatMatch[1]) : (voiceSettings?.repeatCount || 1);
      
      // Clean the text (remove repeat count from reminder text)
      const cleanText = text.replace(/(\d+)\s*times?/i, '').trim();
      
      // Format the reminder message for the backend
      const timeString = dueTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      const dateString = dueTime.toDateString();
      const isTomorrow = dueTime.toDateString() !== new Date().toDateString();
      
      const reminderMessage = `Remind me ${isTomorrow ? 'tomorrow' : 'today'} at ${timeString} to ${cleanText}`;
      
      // Send to backend API with voice settings
      const response = await apiService.sendMessage(reminderMessage);
      
      if (response.type === 'reminder_created' && response.data) {
        // Convert backend data to frontend format
        const backendReminder = response.data as any;
        const newReminder: Reminder = {
          id: backendReminder._id || Date.now().toString(),
          text: cleanText,
          dueTime: new Date(backendReminder.datetime || backendReminder.date),
          isRecurring: false,
          isCompleted: backendReminder.status === 'completed' || false,
          createdAt: new Date(backendReminder.createdAt || Date.now()),
          priority,
          voiceEnabled: voiceSettings?.voiceEnabled !== false,
          repeatCount: detectedRepeatCount,
          notified: backendReminder.notified || false,
        };

        setReminders(prev => {
          console.log('🔔 addReminder - Adding new reminder to state:', newReminder);
          console.log('🔔 addReminder - Previous reminders count:', prev.length);
          
          // Check if reminder already exists to prevent duplicates
          const exists = prev.some(r => r.id === newReminder.id);
          if (exists) {
            console.log('🔔 addReminder - Reminder already exists, skipping duplicate');
            return prev;
          }
          
          const updated = [...prev, newReminder];
          // Sort by creation date (most recent first)
          const sorted = updated.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          console.log('🔔 addReminder - Updated reminders count:', sorted.length);
          return sorted;
        });
        
        toast({
          title: "Reminder Set",
          description: response.response,
        });

        return newReminder;
      } else {
        console.error('🔔 Invalid backend response for reminder creation:', {
          type: response.type,
          hasData: !!response.data
        });
        throw new Error(`Failed to create reminder: Backend returned type '${response.type}' instead of 'reminder_created'`);
      }
    } catch (error) {
      console.error('Error adding reminder:', error);
      
      // Fallback to local storage
      const newReminder: Reminder = {
        id: Date.now().toString(),
        text,
        dueTime,
        isRecurring: false,
        isCompleted: false,
        createdAt: new Date(),
        priority,
        voiceEnabled: voiceSettings?.voiceEnabled !== false,
        repeatCount: voiceSettings?.repeatCount || 1,
        notified: false,
      };

      setReminders(prev => {
        // Check if reminder already exists to prevent duplicates
        const exists = prev.some(r => r.id === newReminder.id);
        if (exists) {
          console.log('🔔 addReminder (fallback) - Reminder already exists, skipping duplicate');
          return prev;
        }
        
        const updated = [...prev, newReminder];
        // Sort by creation date (most recent first)
        return updated.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      
      toast({
        title: "Reminder Set (Local)",
        description: `I'll remind you: "${text}" at ${dueTime.toLocaleString()}`,
        variant: "destructive",
      });

      return newReminder;
    }
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    // Prevent multiple delete calls for the same reminder
    if (deleting.has(id)) {
      console.log('⚠️ Delete already in progress for reminder:', id);
      return;
    }

    console.log('🗑️ Deleting reminder:', id);
    setDeleting(prev => new Set(prev).add(id));
    
    // Store the reminder to restore if needed
    const reminderToDelete = reminders.find(r => r.id === id);
    
    // Immediately remove from UI for instant feedback
    setReminders(prev => {
      console.log('🗑️ Removing reminder from state immediately:', id);
      console.log('🗑️ Previous reminders count:', prev.length);
      const updatedReminders = prev.filter(r => r.id !== id);
      console.log('🗑️ Updated reminders count:', updatedReminders.length);
      return updatedReminders;
    });
    
    try {
      // Call backend API to delete the reminder using apiService
      const response = await apiService.deleteReminder(id);

      if (response.success) {
        toast({
          title: "Reminder Deleted",
          description: "The reminder has been removed.",
        });
        console.log('✅ Reminder deleted successfully');
      } else {
        // If backend delete failed, restore the reminder to local state
        console.error('❌ Backend delete failed:', response);
        
        // Restore the reminder to UI
        if (reminderToDelete) {
          setReminders(prev => [...prev, reminderToDelete]);
          console.log('🔄 Reminder restored to UI after failed delete');
        }
        
        toast({
          title: "Delete Failed",
          description: "Could not delete the reminder. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error deleting reminder:', error);
      
      // Restore the reminder to UI
      if (reminderToDelete) {
        setReminders(prev => [...prev, reminderToDelete]);
        console.log('🔄 Reminder restored to UI after error');
      }
      
      toast({
        title: "Delete Failed",
        description: "Could not delete the reminder. Please try again.",
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

  const toggleComplete = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const newStatus = !reminder.isCompleted;
    
    // If marking as completed, delete the reminder instead of just updating status
    if (newStatus) {
      // Use the existing deleteReminder function which handles UI updates and backend calls
      await deleteReminder(id);
      toast({
        title: "Reminder Completed",
        description: "Great job! The reminder has been removed.",
      });
      return;
    }
    
    // If marking as incomplete (reopening), update the status
    // Optimistically update UI
    setReminders(prev => 
      prev.map(r => 
        r.id === id 
          ? { ...r, isCompleted: newStatus }
          : r
      )
    );

    try {
      // Call backend API to update the reminder status using apiService
      const response = await apiService.updateReminder(id, {
        status: newStatus ? 'completed' : 'pending'
      });

      if (response.success) {
        toast({
          title: "Reminder Reopened",
          description: "Reminder is now pending.",
        });
      } else {
        // If backend update failed, revert the UI change
        setReminders(prev => 
          prev.map(r => 
            r.id === id 
              ? { ...r, isCompleted: !newStatus }
              : r
          )
        );
        
        console.error('❌ Backend update failed:', response);
        
        toast({
          title: "Update Failed",
          description: "Could not update reminder status. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error updating reminder:', error);
      
      // Revert the UI change
      setReminders(prev => 
        prev.map(r => 
          r.id === id 
            ? { ...r, isCompleted: !newStatus }
            : r
        )
      );
      
      toast({
        title: "Update Failed",
        description: "Could not update reminder status. Please try again.",
        variant: "destructive",
      });
    }
  }, [reminders, deleteReminder]);

  const getPendingReminders = useCallback(() => {
    const pending = reminders.filter(r => !r.isCompleted);
    // Sort by creation date (most recent first)
    const sorted = pending.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    console.log('🔔 getPendingReminders - Total reminders:', reminders.length, 'Pending:', sorted.length);
    console.log('🔔 All reminders:', reminders.map(r => ({ id: r.id, text: r.text, isCompleted: r.isCompleted })));
    console.log('🔔 Pending reminders:', sorted.map(r => ({ id: r.id, text: r.text, isCompleted: r.isCompleted })));
    return sorted;
  }, [reminders]);

  const getTodayReminders = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayReminders = reminders.filter(r => 
      r.dueTime >= today && 
      r.dueTime < tomorrow && 
      !r.isCompleted
    );
    // Sort by creation date (most recent first)
    const sorted = todayReminders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    console.log('🔔 getTodayReminders - Total reminders:', reminders.length, 'Today:', sorted.length);
    return sorted;
  }, [reminders]);

  const snoozeReminder = useCallback(async (id: string, minutes: number) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const newDueTime = new Date(reminder.dueTime.getTime() + (minutes * 60 * 1000));
    const snoozeCount = (reminder.snoozeCount || 0) + 1;

    // Optimistically update UI
    setReminders(prev => 
      prev.map(r => 
        r.id === id 
          ? { 
              ...r, 
              dueTime: newDueTime,
              snoozeCount,
              lastSnoozedAt: new Date()
            }
          : r
      )
    );

    try {
      // Call backend API to update the reminder using apiService
      const response = await apiService.updateReminder(id, {
        datetime: newDueTime.toISOString()
      });

      if (response.success) {
        toast({
          title: "Reminder Snoozed",
          description: `Reminder postponed for ${minutes} minutes`,
        });
        console.log('✅ Reminder snoozed successfully');
      } else {
        // If backend update failed, revert the UI change
        setReminders(prev => 
          prev.map(r => 
            r.id === id 
              ? { 
                  ...r, 
                  dueTime: reminder.dueTime,
                  snoozeCount: reminder.snoozeCount || 0,
                  lastSnoozedAt: reminder.lastSnoozedAt
                }
              : r
          )
        );
        
        console.error('❌ Backend snooze failed:', response);
        
        toast({
          title: "Snooze Failed",
          description: "Could not snooze reminder. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error snoozing reminder:', error);
      
      // Revert the UI change
      setReminders(prev => 
        prev.map(r => 
          r.id === id 
            ? { 
                ...r, 
                dueTime: reminder.dueTime,
                snoozeCount: reminder.snoozeCount || 0,
                lastSnoozedAt: reminder.lastSnoozedAt
              }
            : r
        )
      );
      
      toast({
        title: "Snooze Failed",
        description: "Could not snooze reminder. Please try again.",
        variant: "destructive",
      });
    }
  }, [reminders]);

  return {
    reminders,
    loading,
    deleting,
    addReminder,
    deleteReminder,
    toggleComplete,
    snoozeReminder,
    fetchReminders,
    getPendingReminders,
    getTodayReminders,
  };
};