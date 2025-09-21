import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { colors } from '../styles/colors';
import { commonStyles } from '../styles/glassmorphism';
import GlassContainer from '../components/GlassContainer';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import MessageBubble from '../components/MessageBubble';
import apiService from '../services/apiService';
import { ChatMessage, Log, Reminder } from '../types';

const { width, height } = Dimensions.get('window');

interface NotificationData {
  id: number;
  title: string;
  body: string;
  time: string;
}

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Initialize with demo data and welcome message
  useEffect(() => {
    const demoMessages = [
      'Hi Tanya! 👋 Welcome to your complete PA demo!',
      'This simulates a mobile app with push notifications.',
      '📱 Try: "Remind me in 2 minutes to test notifications"'
    ];
    setMessages(demoMessages);

    // Add some demo data
    const demoLogs: Log[] = [
      { 
        id: 1, 
        action: 'Started the day with coffee ☕', 
        time: '8:00 AM', 
        originalInput: 'Log that I started the day with coffee',
        date: new Date()
      },
      { 
        id: 2, 
        action: 'Reviewed emails and priorities', 
        time: '9:30 AM', 
        originalInput: 'Log that I reviewed emails',
        date: new Date()
      }
    ];
    setLogs(demoLogs);

    const demoReminders: Reminder[] = [
      { 
        id: 1, 
        text: 'Call the dentist for appointment', 
        time: '14:00', 
        originalInput: 'Remind me to call dentist',
        date: new Date(),
        completed: false
      },
      { 
        id: 2, 
        text: 'Buy groceries for weekend', 
        time: '18:30', 
        originalInput: 'Remind me to buy groceries',
        date: new Date(),
        completed: false
      }
    ];
    setReminders(demoReminders);

    // Request notification permissions
    requestNotificationPermissions();
  }, []);

  // Update time every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Check for reminders and send push notifications
  useEffect(() => {
    const now = new Date();
    const currentTimeString = now.toTimeString().slice(0, 5);
    const currentDateString = now.toISOString().split('T')[0];
    
    reminders.forEach(reminder => {
      if (
        reminder.time &&
        reminder.time === currentTimeString &&
        !reminder.completed
      ) {
        // Send push notification
        sendPushNotification(reminder);
        
        // Add to chat
        setMessages(prev => [...prev, `🚨 PUSH NOTIFICATION: ${reminder.text}`]);
      }
    });
  }, [currentTime, reminders]);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      setMessages(prev => [...prev, '✅ Push notifications enabled!']);
    }
  };

  const sendPushNotification = async (reminder: Reminder) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📱 Tanya's PA",
          body: reminder.text,
          sound: true,
        },
        trigger: null, // Send immediately
      });

      // Create visual notification
      const notification: NotificationData = {
        id: Date.now(),
        title: "📱 Tanya's PA",
        body: reminder.text,
        time: new Date().toLocaleTimeString(),
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const parseTime = (text: string) => {
    // Handle "in X minutes" format
    const minutesRegex = /in\s+(\d+)\s+minutes?\s+to\s+(.+)/i;
    const minutesMatch = text.match(minutesRegex);
    
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]);
      const task = minutesMatch[2];
      const targetTime = new Date();
      targetTime.setMinutes(targetTime.getMinutes() + minutes);
      
      return {
        time: targetTime.toTimeString().slice(0, 5),
        date: targetTime,
        task: task
      };
    }

    // Regular time parsing
    const dateTimeRegex = /(today|tomorrow)?\s*at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
    const match = text.match(dateTimeRegex);
    
    if (match) {
      let hours = parseInt(match[2]);
      let minutes = parseInt(match[3] || '0');
      const ampm = match[4]?.toLowerCase();
      
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      if (!ampm && hours >= 1 && hours <= 11) {
        const currentHour = new Date().getHours();
        if (currentHour >= 12) hours += 12;
      }
      
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const now = new Date();
      const targetDate = new Date(now);
      
      if (match[1]?.toLowerCase() === 'tomorrow') {
        targetDate.setDate(now.getDate() + 1);
      }
      
      const taskText = text.replace(dateTimeRegex, '').trim();
      
      return { 
        time: timeString, 
        date: targetDate,
        task: taskText 
      };
    }
    
    return { time: null, date: null, task: text };
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userInput = inputText.toLowerCase();
    let response = '';
    
    setMessages(prev => [...prev, `You: ${inputText}`]);
    setIsLoading(true);
    
    try {
      // Try API first
      const apiResponse = await apiService.sendMessage(inputText.trim());
      response = apiResponse.response;
      
      // Handle API response data
      if (apiResponse.data) {
        if (apiResponse.type === 'log_created' && typeof apiResponse.data === 'object' && 'action' in apiResponse.data) {
          setLogs(prev => [...prev, apiResponse.data as Log]);
        } else if (apiResponse.type === 'reminder_created' && typeof apiResponse.data === 'object' && 'text' in apiResponse.data) {
          setReminders(prev => [...prev, apiResponse.data as Reminder]);
        }
      }
    } catch (error) {
      // Fallback to local processing
      if (userInput.includes('show') && userInput.includes('logs')) {
        response = logs.length > 0 
          ? `📋 Your logs (${logs.length}):\n${logs.map((l, i) => `${i+1}. ${l.action} (${l.time})`).join('\n')}`
          : 'No logs yet. Try: "Log that I had breakfast"';
          
      } else if (userInput.includes('show') && userInput.includes('reminders')) {
        const activeReminders = reminders.filter(r => !r.completed);
        response = activeReminders.length > 0
          ? `📅 Your reminders (${activeReminders.length}):\n${activeReminders.map((r, i) => {
              const timeText = r.time ? ` at ${formatTime(r.time)}` : '';
              return `${i+1}. ${r.text}${timeText}`;
            }).join('\n')}`
          : '📅 No active reminders.';
          
      } else if (userInput.includes('log') && !userInput.includes('show')) {
        const activity = inputText.replace(/log that /i, '');
        const newLog: Log = {
          id: Date.now(),
          action: activity,
          time: new Date().toLocaleTimeString(),
          originalInput: inputText,
          date: new Date()
        };
        setLogs(prev => [...prev, newLog]);
        response = `✅ Logged: "${activity}" at ${newLog.time}`;
        
      } else if (userInput.includes('remind')) {
        const taskInput = inputText.replace(/remind me to /i, '').replace(/remind me /i, '');
        const parsed = parseTime(taskInput);
        
        const newReminder: Reminder = {
          id: Date.now(),
          text: parsed.task,
          time: parsed.time || '',
          originalInput: inputText,
          date: parsed.date || new Date(),
          completed: false
        };
        
        setReminders(prev => [...prev, newReminder]);
        
        if (parsed.time) {
          response = `✅ Reminder set "${parsed.task}" at ${formatTime(parsed.time)}. You'll get a push notification! 📱🔔`;
        } else {
          response = `✅ Reminder added: "${parsed.task}"`;
        }
        
      } else if (userInput.includes('demo') || userInput.includes('test')) {
        // Create a test reminder for 30 seconds from now
        const testTime = new Date();
        testTime.setSeconds(testTime.getSeconds() + 30);
        
        const testReminder: Reminder = {
          id: Date.now(),
          text: 'Demo notification test',
          time: testTime.toTimeString().slice(0, 5),
          originalInput: inputText,
          date: testTime,
          completed: false
        };
        
        setReminders(prev => [...prev, testReminder]);
        response = `🧪 Demo test scheduled! You'll get a notification in 30 seconds.`;
        
      } else {
        response = `📱 COMPLETE DEMO FEATURES:
• Log activities: "Log that I had breakfast"
• Set reminders: "Remind me at 6pm to call mom"
• Quick reminders: "Remind me in 5 minutes to check this"
• View data: "Show my logs" or "Show my reminders"
• Test notifications: "Demo" or "Test"

This simulates a complete mobile app experience! 🎉`;
      }
    } finally {
      setIsLoading(false);
    }
    
    setMessages(prev => [...prev, `📱 Tanya's PA: ${response}`]);
    setInputText('');
  };

  const completeReminder = (id: number) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, completed: true } : r
    ));
    setMessages(prev => [...prev, '📱 Tanya\'s PA: ✅ Reminder completed!']);
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : (hours === '00' ? 12 : parseInt(hours));
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderMessage = ({ item }: { item: string }) => (
    <View style={[
      styles.messageContainer,
      item.includes('PUSH NOTIFICATION') && styles.pushNotificationMessage,
      item.startsWith('You:') && styles.userMessage
    ]}>
      <Text style={styles.messageText}>{item}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>📶 Tanya's Network</Text>
          <Text style={styles.statusText}>{currentTime.toLocaleTimeString().slice(0, 5)}</Text>
          <Text style={styles.statusText}>🔋 100%</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>👩‍💼 Tanya's PA</Text>
          <Text style={styles.subtitle}>Complete Mobile Demo • Push Notifications</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Text style={styles.statText}>📝 {logs.length} logs</Text>
          <Text style={styles.statText}>⏰ {reminders.filter(r => !r.completed).length} active</Text>
          <Text style={styles.statText}>✅ {reminders.filter(r => r.completed).length} done</Text>
        </View>

        {/* Quick Actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
          {[
            { id: 'log', title: '+ Log', action: () => setInputText("Log that I "), color: '#e8f0fe' },
            { id: 'reminder', title: '+ Reminder', action: () => setInputText("Remind me at 6pm to "), color: '#fef7e0' },
            { id: 'logs', title: '📋 Logs', action: () => setInputText("Show my logs"), color: '#e6f4ea' },
            { id: 'reminders', title: '⏰ Reminders', action: () => setInputText("Show my reminders"), color: '#fce8e6' },
            { id: 'test', title: '🧪 Test', action: () => setInputText("Demo"), color: '#f3e8ff' }
          ].map((btn) => (
            <TouchableOpacity
              key={btn.id}
              onPress={btn.action}
              style={[styles.quickActionButton, { backgroundColor: btn.color }]}
            >
              <Text style={styles.quickActionText}>{btn.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              style={styles.textInput}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            >
              <Text style={styles.sendButtonText}>{isLoading ? "..." : "Send"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Active Reminders */}
        {reminders.filter(r => !r.completed).length > 0 && (
          <View style={styles.activeReminders}>
            <View style={styles.activeRemindersHeader}>
              <Text style={styles.activeRemindersTitle}>
                ⏰ Active Reminders ({reminders.filter(r => !r.completed).length})
              </Text>
            </View>
            {reminders.filter(r => !r.completed).slice(0, 3).map(reminder => (
              <View key={`reminder-${reminder.id}`} style={styles.reminderItem}>
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderText}>{reminder.text}</Text>
                  {reminder.time && (
                    <Text style={styles.reminderTime}>
                      at {formatTime(reminder.time)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => completeReminder(reminder.id)}
                  style={styles.completeButton}
                >
                  <Text style={styles.completeButtonText}>✓</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Push Notification Overlays */}
        {notifications.map(notification => (
          <View key={`notification-${notification.id}`} style={styles.notificationOverlay}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationEmoji}>📱</Text>
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationBody}>{notification.body}</Text>
              </View>
              <Text style={styles.notificationTime}>now</Text>
            </View>
          </View>
        ))}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  statusBar: {
    height: 44,
    backgroundColor: '#4285f4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#4285f4',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  stats: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statText: {
    fontSize: 13,
    color: '#333',
  },
  quickActions: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickActionButton: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
  },
  messagesList: {
    flex: 1,
    backgroundColor: 'white',
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f1f8e9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pushNotificationMessage: {
    backgroundColor: '#ffebee',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  userMessage: {
    backgroundColor: '#e3f2fd',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4285f4',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  activeReminders: {
    backgroundColor: '#fff3cd',
    maxHeight: 150,
  },
  activeRemindersHeader: {
    backgroundColor: '#fbbc04',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  activeRemindersTitle: {
    color: '#202124',
    fontWeight: '500',
    fontSize: 14,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reminderContent: {
    flex: 1,
  },
  reminderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  reminderTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  completeButton: {
    backgroundColor: '#34a853',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationOverlay: {
    position: 'absolute',
    top: 80,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 12,
    padding: 15,
    zIndex: 1000,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationEmoji: {
    fontSize: 20,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notificationBody: {
    color: 'white',
    fontSize: 13,
    opacity: 0.9,
  },
  notificationTime: {
    color: 'white',
    fontSize: 12,
    opacity: 0.7,
  },
});

export default ChatScreen;
