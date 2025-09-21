// CACHE BUST: Fixed notification actions error - v2.0
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Settings, 
  TestTube,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { Reminder } from '@/types/reminder';
// Removed VoiceReminderNotification import - user doesn't want popup cards
import textToSpeechService from '@/services/textToSpeechService';
import voiceCommandService from '@/services/voiceCommandService';
import offlineReminderService from '@/services/offlineReminderService';
import apiService from '@/services/apiService';
import { useRemindersContext } from '@/contexts/RemindersContext';
import { toast } from '@/hooks/use-toast';

interface VoiceReminderManagerProps {
  className?: string;
}

export const VoiceReminderManager: React.FC<VoiceReminderManagerProps> = ({ className }) => {
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSettings, setShowSettings] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [notifiedReminders, setNotifiedReminders] = useState<Set<string>>(new Set());
  const { reminders, snoozeReminder, deleteReminder } = useRemindersContext();

  // Monitor online/offline status and request notification permission
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Request notification permission on app start
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('🔔 Notification permission granted');
          // Use setTimeout to move toast call out of render cycle
          setTimeout(() => {
            toast({
              title: "Notifications Enabled",
              description: "You'll receive reminder alerts even when the app is in the background!",
            });
          }, 0);
        } else {
          console.log('🔔 Notification permission denied');
        }
      });
    }

    // Enable speech synthesis on first user interaction
    const enableSpeech = () => {
      textToSpeechService.enableSpeechSynthesis();
      console.log('🔊 Speech synthesis enabled by user interaction');
    };

    // Listen for any user interaction to enable speech
    window.addEventListener('click', enableSpeech, { once: true });
    window.addEventListener('keydown', enableSpeech, { once: true });
    window.addEventListener('touchstart', enableSpeech, { once: true });
    window.addEventListener('mousedown', enableSpeech, { once: true });
    window.addEventListener('focus', enableSpeech, { once: true });

    // Clean up old notified reminders every 5 minutes to prevent memory buildup
    const cleanupInterval = setInterval(() => {
      setNotifiedReminders(prev => {
        const newSet = new Set(prev);
        // Keep only reminders that are still active
        activeReminders.forEach(reminder => {
          if (!newSet.has(reminder.id)) {
            newSet.delete(reminder.id);
          }
        });
        return newSet;
      });
    }, 300000); // 5 minutes

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(cleanupInterval);
    };
  }, [activeReminders]);

  // WebSocket connection for real-time reminder notifications
  useEffect(() => {
    if (!isOnline) return;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:3000/ws');
        
        ws.onopen = () => {
          console.log('🔌 WebSocket connected for reminder notifications');
          setWsConnection(ws);
          
          // Send a test message to verify connection
          ws.send(JSON.stringify({ type: 'ping' }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', data);
            console.log('📨 Raw WebSocket data:', event.data);
            
            if (data.type === 'reminder_alert' && data.reminder) {
              console.log('🔔 Processing reminder alert from WebSocket:', data.reminder);
              console.log('🔔 Reminder ID:', data.reminder.id);
              console.log('🔔 Reminder text:', data.reminder.text);
              
              // Convert backend reminder to frontend format
              const reminder: Reminder = {
                id: data.reminder._id || data.reminder.id,
                text: data.reminder.text,
                dueTime: new Date(data.reminder.datetime || data.reminder.date),
                isRecurring: false,
                isCompleted: false,
                createdAt: new Date(data.reminder.createdAt || Date.now()),
                priority: 'medium',
                voiceEnabled: data.reminder.voiceEnabled !== false,
                repeatCount: data.reminder.repeatCount || 1,
              };

              // Add to active reminders if not already present
              setActiveReminders(prev => {
                const exists = prev.some(r => r.id === reminder.id);
                if (!exists) {
                  console.log('🔔 Adding reminder from WebSocket to active reminders:', reminder.text);
                  
                    // Check if we've already notified for this reminder
                    if (!notifiedReminders.has(reminder.id)) {
                      // Play voice reminder if voice is enabled
                      if (isVoiceEnabled && reminder.voiceEnabled !== false) {
                        console.log('🔊 Playing voice reminder:', reminder.text);
                        
                        // Force enable speech synthesis for reminder alerts
                        textToSpeechService.enableSpeechSynthesis();
                        
                        // Stop any current speech to prevent interruptions
                        textToSpeechService.stop();
                        
                        // Try to play voice reminder with no delay
                        textToSpeechService.speakReminder(reminder.text, {
                          repeat: false,
                          repeatCount: 1,
                          delay: 0
                        }).then(() => {
                          console.log('🔊 Voice reminder completed successfully');
                        }).catch(error => {
                          console.error('🔊 Voice reminder failed:', error);
                          // Don't show error toast for voice failures to avoid spam
                        });
                      } else {
                        console.log('🔊 Voice reminder skipped - isVoiceEnabled:', isVoiceEnabled, 'reminder.voiceEnabled:', reminder.voiceEnabled);
                      }
                  
                    // Show simple toast notification only (no popup cards)
                    // Use setTimeout to move toast call out of render cycle
                    setTimeout(() => {
                      toast({
                        title: "🔔 Reminder",
                        description: reminder.text,
                        duration: 5000, // Show for 5 seconds
                      });
                    }, 0);
                    
                    // Mark as notified
                    setNotifiedReminders(prev => new Set(prev).add(reminder.id));
                  }
                  
                  return [...prev, reminder];
                } else {
                  console.log('🔔 Reminder already exists in active reminders:', reminder.text);
                }
                return prev;
              });
            } else {
              console.log('📨 WebSocket message type not reminder_alert:', data.type);
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          console.error('❌ WebSocket readyState:', ws.readyState);
        };

        ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          setWsConnection(null);
          // Reconnect after 3 seconds
          setTimeout(() => {
            console.log('🔄 Attempting WebSocket reconnection...');
            connectWebSocket();
          }, 3000);
        };

        return ws;
      } catch (error) {
        console.error('❌ Error connecting WebSocket:', error);
        return null;
      }
    };

    const ws = connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isOnline]);

  // Check for due reminders and show voice notifications (fallback polling)
  useEffect(() => {
    const checkDueReminders = () => {
      // Skip if no reminders to check
      if (reminders.length === 0) {
        return;
      }
      
      const now = new Date();
      
      // Only check for reminders that are due and not completed
      const dueReminders = reminders.filter(
        reminder => !reminder.isCompleted && reminder.dueTime <= now
      );

      // Filter out reminders that are already being shown or already notified
      const newDueReminders = dueReminders.filter(
        reminder => !activeReminders.some(active => active.id === reminder.id) &&
                   !notifiedReminders.has(reminder.id)
      );

      console.log('🔍 Checking due reminders:', {
        totalReminders: reminders.length,
        dueReminders: dueReminders.length,
        newDueReminders: newDueReminders.length,
        activeReminders: activeReminders.length,
        notifiedReminders: notifiedReminders.size
      });

      if (newDueReminders.length > 0) {
        console.log('🔔 Adding reminders from polling (fallback):', newDueReminders.map(r => r.text));
        
        // Show toast notifications for each new reminder
        newDueReminders.forEach(reminder => {
          // Check if we've already notified for this reminder
          if (!notifiedReminders.has(reminder.id)) {
            // Play voice reminder if voice is enabled
            if (isVoiceEnabled && reminder.voiceEnabled !== false) {
              console.log('🔊 Playing voice reminder (polling):', reminder.text);
              
              // Force enable speech synthesis for reminder alerts
              textToSpeechService.enableSpeechSynthesis();
              
              // Stop any current speech to prevent interruptions
              textToSpeechService.stop();
              
              // Try to play voice reminder with no delay
              textToSpeechService.speakReminder(reminder.text, {
                repeat: false,
                repeatCount: 1,
                delay: 0
              }).then(() => {
                console.log('🔊 Voice reminder completed successfully (polling)');
              }).catch(error => {
                console.error('🔊 Voice reminder failed (polling):', error);
                // Don't show error toast for voice failures to avoid spam
              });
            } else {
              console.log('🔊 Voice reminder skipped (polling) - isVoiceEnabled:', isVoiceEnabled, 'reminder.voiceEnabled:', reminder.voiceEnabled);
            }
          
            // Use setTimeout to move toast call out of render cycle
            setTimeout(() => {
              toast({
                title: "🔔 Reminder",
                description: reminder.text,
                duration: 5000, // Show for 5 seconds
              });
            }, 0);
            
            // Mark as notified
            setNotifiedReminders(prev => new Set(prev).add(reminder.id));
          }
        });
        
        setActiveReminders(prev => [...prev, ...newDueReminders]);
      }
    };

    // Only run polling as fallback when WebSocket is not connected
    const interval = setInterval(checkDueReminders, wsConnection ? 600000 : 30000); // 10 minutes when WS connected, 30 seconds when not
    if (!wsConnection) {
      checkDueReminders(); // Only check immediately if no WebSocket connection
    }

    return () => clearInterval(interval);
  }, [reminders, activeReminders, wsConnection]);

  // Handle reminder actions
  const handleSnooze = async (reminderId: string, minutes: number) => {
    await snoozeReminder(reminderId, minutes);
    setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
    setNotifiedReminders(prev => {
      const newSet = new Set(prev);
      newSet.delete(reminderId);
      return newSet;
    });
  };

  const handleDismiss = async (reminderId: string) => {
    try {
      // Use apiService to dismiss the reminder
      const response = await apiService.dismissReminder(reminderId, 'manual');

      if (response.success) {
        console.log('✅ Reminder dismissed successfully');
        setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
        setNotifiedReminders(prev => {
          const newSet = new Set(prev);
          newSet.delete(reminderId);
          return newSet;
        });
        setTimeout(() => {
          toast({
            title: "Reminder Dismissed",
            description: "Reminder has been marked as completed.",
          });
        }, 0);
      } else {
        console.error('❌ Failed to dismiss reminder');
        // Fallback to delete if dismiss fails
        await deleteReminder(reminderId);
        setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
        setNotifiedReminders(prev => {
          const newSet = new Set(prev);
          newSet.delete(reminderId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('❌ Error dismissing reminder:', error);
      // Fallback to delete if dismiss fails
      await deleteReminder(reminderId);
      setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
      setNotifiedReminders(prev => {
        const newSet = new Set(prev);
        newSet.delete(reminderId);
        return newSet;
      });
    }
  };

  // Removed repeat functionality

  // Test voice functionality
  const testVoice = async () => {
    if (!textToSpeechService.isServiceSupported()) {
      toast({
        title: "Voice Not Supported",
        description: "Text-to-speech is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      await textToSpeechService.test();
      toast({
        title: "Voice Test Successful",
        description: "Text-to-speech is working correctly!",
      });
    } catch (error) {
      toast({
        title: "Voice Test Failed",
        description: "There was an error with text-to-speech.",
        variant: "destructive",
      });
    }
  };

  // Test voice commands
  const testVoiceCommands = async () => {
    if (!voiceCommandService.isServiceSupported()) {
      toast({
        title: "Voice Commands Not Supported",
        description: "Voice commands are not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      await voiceCommandService.test();
      toast({
        title: "Voice Commands Test Successful",
        description: "Voice commands are working correctly!",
      });
    } catch (error) {
      toast({
        title: "Voice Commands Test Failed",
        description: "There was an error with voice commands.",
        variant: "destructive",
      });
    }
  };

  // Get service status
  const getServiceStatus = () => {
    const offlineStatus = offlineReminderService.getStatus();
    return {
      textToSpeech: textToSpeechService.isServiceSupported(),
      voiceCommands: voiceCommandService.isServiceSupported(),
      offline: offlineStatus.isSupported,
      online: isOnline,
      offlineReminders: offlineStatus.reminderCount,
      pendingReminders: offlineStatus.pendingCount
    };
  };

  const status = getServiceStatus();

  return (
    <div className={className}>
      {/* Voice Reminder Status Banner */}
      {!textToSpeechService.hasUserInteractedWithPage() && (
        <div className="mb-6 p-4 bg-gradient-electric/20 border border-accent-electric/40 rounded-xl">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-accent-electric" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Voice Reminders Ready</h3>
              <p className="text-sm text-muted-foreground">
                Click the "Enable & Test Voice" button below to activate voice reminders for all future alerts!
              </p>
            </div>
            <Button
              size="sm"
              variant="electric"
              onClick={() => {
                textToSpeechService.enableSpeechSynthesis();
                textToSpeechService.speak("Voice reminders are now enabled!", {
                  rate: 0.9,
                  volume: 0.7
                }).catch(error => {
                  console.error('Voice activation failed:', error);
                });
              }}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Enable Voice
            </Button>
          </div>
        </div>
      )}

      {/* Active Voice Reminders - Removed popup cards as user doesn't want them */}

      {/* Voice Reminder Manager Card */}
      <Card className="w-full bg-gradient-electric/10 border-accent-electric/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-accent-electric" />
              Voice Reminder Manager
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-white/30 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${status.textToSpeech ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Text-to-Speech</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white/30 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${status.voiceCommands ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Voice Commands</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white/30 rounded-lg">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white/30 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{status.pendingReminders} Pending</span>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="space-y-4 p-4 bg-white/20 rounded-lg border border-accent-electric/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Voice Notifications</span>
                <Button
                  variant={isVoiceEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                >
                  {isVoiceEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4 mr-2" />
                      Disabled
                    </>
                  )}
                </Button>
              </div>

              {/* Test Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testVoice}
                  disabled={!status.textToSpeech}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Voice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testVoiceCommands}
                  disabled={!status.voiceCommands}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Test Commands
                </Button>
              </div>
              
              {/* Test Reminder Alert */}
              <div className="pt-2 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Create a test reminder alert
                    const testReminder: Reminder = {
                      id: 'test-' + Date.now(),
                      text: 'Test reminder - take medicine',
                      dueTime: new Date(),
                      isRecurring: false,
                      isCompleted: false,
                      createdAt: new Date(),
                      priority: 'medium',
                      voiceEnabled: true,
                      repeatCount: 1,
                    };
                    
                    setActiveReminders(prev => [...prev, testReminder]);
                    
                    toast({
                      title: "🔔 Test Reminder Alert",
                      description: "Test reminder created - you should see visual and voice alerts",
                      duration: 5000,
                    });
                  }}
                  className="w-full"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Test Reminder Alert
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    console.log('🔊 Testing voice directly...');
                    console.log('🔊 Voice service status:', textToSpeechService.getStatus());
                    console.log('🔊 Voice service supported:', textToSpeechService.isServiceSupported());
                    console.log('🔊 User interacted:', textToSpeechService.hasUserInteractedWithPage());
                    
                    // Force enable speech synthesis
                    textToSpeechService.enableSpeechSynthesis();
                    
                    try {
                      await textToSpeechService.speakReminder('Direct voice test - this should work!', {
                        repeat: false,
                        repeatCount: 1,
                        delay: 500
                      });
                      console.log('🔊 Direct voice test completed successfully');
                      toast({
                        title: "🔊 Voice Test Successful",
                        description: "Voice reminder system is working!",
                        duration: 3000,
                      });
                    } catch (error) {
                      console.error('🔊 Direct voice test failed:', error);
                      toast({
                        title: "🔊 Voice Test Failed",
                        description: "Voice reminder system needs user interaction. Try clicking the 'Enable & Test Voice' button first.",
                        variant: "destructive",
                        duration: 5000,
                      });
                    }
                  }}
                  className="w-full"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Test Voice Directly
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    console.log('🔔 Testing reminder notification flow...');
                    
                    // Create a test reminder that triggers immediately
                    const testReminder: Reminder = {
                      id: 'test-' + Date.now(),
                      text: 'Test reminder notification - check console for logs',
                      dueTime: new Date(),
                      isRecurring: false,
                      isCompleted: false,
                      createdAt: new Date(),
                      priority: 'medium',
                      voiceEnabled: true,
                      repeatCount: 1,
                    };
                    
                    // Add to active reminders to trigger notification flow
                    setActiveReminders(prev => [...prev, testReminder]);
                    
                    // Play voice reminder
                    if (isVoiceEnabled) {
                      textToSpeechService.enableSpeechSynthesis();
                      try {
                        await textToSpeechService.speakReminder(testReminder.text, {
                          repeat: false,
                          repeatCount: 1,
                          delay: 500
                        });
                        console.log('🔊 Test reminder voice played successfully');
                      } catch (error) {
                        console.error('🔊 Test reminder voice failed:', error);
                      }
                    }
                    
                    // Show toast
                    toast({
                      title: "🔔 Test Reminder Alert",
                      description: testReminder.text,
                      duration: 10000,
                    });
                    
                    // Mark as notified
                    setNotifiedReminders(prev => new Set(prev).add(testReminder.id));
                    
                    console.log('🔔 Test reminder notification flow completed');
                  }}
                  className="w-full"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Test Reminder Flow
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    console.log('🔔 Creating test reminder via API...');
                    
                    try {
                      // Create a reminder that triggers in 5 seconds
                      const response = await fetch('http://localhost:3000/api/reminders', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          text: 'Test reminder from frontend button',
                          datetime: new Date(Date.now() + 5000).toISOString(),
                          voiceEnabled: true,
                          repeatCount: 1
                        }),
                      });
                      
                      const result = await response.json();
                      console.log('🔔 Reminder created:', result);
                      
                      toast({
                        title: "🔔 Test Reminder Created",
                        description: "Reminder will trigger in 5 seconds. Check console for WebSocket messages.",
                        duration: 8000,
                      });
                    } catch (error) {
                      console.error('🔔 Error creating reminder:', error);
                      toast({
                        title: "🔔 Error",
                        description: "Failed to create test reminder",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Create Test Reminder
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    console.log('🎤 Testing speech recognition...');
                    const voiceCommandService = (await import('@/services/voiceCommandService')).default;
                    
                    console.log('🎤 Speech recognition supported:', voiceCommandService.isServiceSupported());
                    console.log('🎤 Microphone permission:', await voiceCommandService.checkMicrophonePermission());
                    
                    try {
                      const success = await voiceCommandService.startListening((command) => {
                        console.log('🎤 Voice command received:', command);
                        toast({
                          title: "🎤 Voice Command",
                          description: `Command: ${command.type}${command.duration ? ` (${command.duration} min)` : ''}`,
                          duration: 3000,
                        });
                      });
                      
                      if (success) {
                        toast({
                          title: "🎤 Listening...",
                          description: "Speak a command like 'snooze 10 minutes' or 'dismiss'",
                          duration: 5000,
                        });
                      } else {
                        toast({
                          title: "🎤 Speech Recognition Failed",
                          description: "Could not start speech recognition. Check microphone permissions.",
                          duration: 5000,
                        });
                      }
                    } catch (error) {
                      console.error('🎤 Speech recognition test failed:', error);
                      toast({
                        title: "🎤 Speech Recognition Error",
                        description: `Error: ${error}`,
                        duration: 5000,
                      });
                    }
                  }}
                  className="w-full"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Test Speech Recognition
                </Button>
              </div>

              {/* Offline Status */}
              {!isOnline && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700 flex items-center gap-2">
                    <WifiOff className="h-4 w-4" />
                    Offline mode: Using local voice reminders
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {status.offlineReminders} offline reminders stored
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                // Enable speech synthesis immediately
                textToSpeechService.enableSpeechSynthesis();
                
                if (isVoiceEnabled) {
                  textToSpeechService.speak("Voice reminders are working correctly!", {
                    rate: 0.9,
                    volume: 0.7
                  }).catch(error => {
                    console.error('Voice test failed:', error);
                    toast({
                      title: "Voice Test Failed",
                      description: "Please try clicking the button again to enable voice reminders.",
                      variant: "destructive",
                    });
                  });
                }
              }}
              disabled={!isVoiceEnabled || !status.textToSpeech}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Enable & Test Voice
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const pendingCount = reminders.filter(r => !r.isCompleted).length;
                if (pendingCount > 0) {
                  textToSpeechService.speak(`You have ${pendingCount} pending reminders`, {
                    rate: 0.9,
                    volume: 0.7
                  });
                } else {
                  textToSpeechService.speak("You have no pending reminders", {
                    rate: 0.9,
                    volume: 0.7
                  });
                }
              }}
              disabled={!isVoiceEnabled || !status.textToSpeech}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Status
            </Button>
          </div>

          {/* Service Status Badges */}
          <div className="flex flex-wrap gap-2">
            {status.textToSpeech && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Volume2 className="h-3 w-3 mr-1" />
                TTS Ready
              </Badge>
            )}
            {status.voiceCommands && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Mic className="h-3 w-3 mr-1" />
                Voice Commands
              </Badge>
            )}
            {!isOnline && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline Mode
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
