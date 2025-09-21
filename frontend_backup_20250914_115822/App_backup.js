import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import apiService from './src/services/apiService';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function TanyasPA() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Initialize app
  useEffect(() => {
    requestNotificationPermissions();
    loadData();
    setupTimeUpdater();
    setupNotificationListener();
  }, []);

  // Update time every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      checkReminders();
    }, 10000);
    return () => clearInterval(timer);
  }, [reminders]);

  // Request notification permissions
  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        console.log('Notification permissions granted');
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  // Setup notification listener
  const setupNotificationListener = () => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    return () => subscription.remove();
  };

  // Setup time updater
  const setupTimeUpdater = () => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  };

  // Load data from AsyncStorage
  const loadData = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem('tanyas_pa_logs');
      const savedReminders = await AsyncStorage.getItem('tanyas_pa_reminders');
      const savedMessages = await AsyncStorage.getItem('tanyas_pa_messages');

      if (savedLogs) {
        const logsData = JSON.parse(savedLogs);
        // Migrate old numeric IDs to string IDs
        const migratedLogs = logsData.map(log => ({
          ...log,
          id: typeof log.id === 'number' ? `migrated-log-${log.id}` : log.id
        }));
        setLogs(migratedLogs);
        await saveData('tanyas_pa_logs', migratedLogs);
      }
      
      if (savedReminders) {
        const remindersData = JSON.parse(savedReminders);
        // Migrate old numeric IDs to string IDs
        const migratedReminders = remindersData.map(reminder => ({
          ...reminder,
          id: typeof reminder.id === 'number' ? `migrated-reminder-${reminder.id}` : reminder.id
        }));
        setReminders(migratedReminders);
        await saveData('tanyas_pa_reminders', migratedReminders);
      }
      
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        const welcomeMessages = [
          'Hi Tanya! 👋 Your mobile PA is ready with push notifications! 📱',
          'This app connects to your backend API and stores data locally.',
          'Try: "Remind me in 2 minutes to test notifications"'
        ];
        setMessages(welcomeMessages);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Save data to AsyncStorage
  const saveData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Check for due reminders and send push notifications
  const checkReminders = async () => {
    const now = new Date();
    const currentTimeString = now.toTimeString().slice(0, 5);
    const currentDateString = now.toISOString().split('T')[0];

    reminders.forEach(async (reminder) => {
      if (
        reminder.time &&
        reminder.date &&
        reminder.time === currentTimeString &&
        reminder.date === currentDateString &&
        !reminder.notified &&
        !reminder.done
      ) {
        // Send push notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🔔 Tanya's PA Reminder",
            body: reminder.text,
            sound: true,
          },
          trigger: null, // Send immediately
        });

        // Mark as notified
        const updatedReminders = reminders.map(r => 
          r.id === reminder.id ? { ...r, notified: true } : r
        );
        setReminders(updatedReminders);
        await saveData('tanyas_pa_reminders', updatedReminders);

        // Add to chat
        setMessages(prev => [...prev, `🚨 PUSH NOTIFICATION: ${reminder.text}`]);
      }
    });
  };

  // Parse time from natural language
  const parseTime = (text) => {
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
        date: targetTime.toISOString().split('T')[0],
        dateWord: 'today',
        task: task
      };
    }

    // Regular time parsing
    const dateTimeRegex = /(today|tomorrow)?\s*at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
    const match = text.match(dateTimeRegex);

    if (match) {
      const dateWord = match[1]?.toLowerCase() || 'today';
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

      if (dateWord === 'tomorrow') {
        targetDate.setDate(now.getDate() + 1);
      }

      const dateString = targetDate.toISOString().split('T')[0];
      const taskText = text.replace(dateTimeRegex, '').trim();

      return {
        time: timeString,
        date: dateString,
        dateWord: dateWord,
        task: taskText,
      };
    }

    return { time: null, date: null, task: text, dateWord: 'today' };
  };

  // Handle user messages
  const handleMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.toLowerCase();
    let response = '';

    setMessages(prev => [...prev, `You: ${input}`]);
    setIsLoading(true);

    try {
      // Try API first
      const apiResponse = await apiService.sendMessage(input.trim());
      response = apiResponse.response;
      
      // Handle API response data
      if (apiResponse.data) {
        if (apiResponse.type === 'log_created' && typeof apiResponse.data === 'object' && 'action' in apiResponse.data) {
          const newLog = {
            id: `api-log-${apiResponse.data.id}`,
            text: apiResponse.data.action,
            time: apiResponse.data.time,
            date: apiResponse.data.date.toString()
          };
          const updatedLogs = [...logs, newLog];
          setLogs(updatedLogs);
          await saveData('tanyas_pa_logs', updatedLogs);
        } else if (apiResponse.type === 'reminder_created' && typeof apiResponse.data === 'object' && 'text' in apiResponse.data) {
          const newReminder = {
            id: `api-reminder-${apiResponse.data.id}`,
            text: apiResponse.data.text,
            time: apiResponse.data.time,
            date: apiResponse.data.date.toString(),
            dateWord: 'today',
            done: false,
            notified: false
          };
          const updatedReminders = [...reminders, newReminder];
          setReminders(updatedReminders);
          await saveData('tanyas_pa_reminders', updatedReminders);
        }
      }
    } catch (error) {
      // Fallback to local processing
      if (userInput.includes('show') && userInput.includes('logs')) {
        response = logs.length > 0 
          ? `📋 Your logs (${logs.length}):\n${logs.map((l, i) => `${i+1}. ${l.text} (${l.time})`).join('\n')}`
          : 'No logs yet. Try: "Log that I had breakfast"';

      } else if (userInput.includes('show') && userInput.includes('reminders')) {
        const activeReminders = reminders.filter(r => !r.done);
        response = activeReminders.length > 0
          ? `⏰ Your reminders (${activeReminders.length}):\n${activeReminders.map((r, i) => {
              const timeText = r.time ? ` at ${r.time}` : '';
              const dateText = r.dateWord !== 'today' ? ` ${r.dateWord}` : '';
              const status = r.notified ? ' ✅' : ' ⏳';
              return `${i+1}. ${r.text}${dateText}${timeText}${status}`;
            }).join('\n')}`
          : '⏰ No active reminders.';

      } else if (userInput.includes('log') && !userInput.includes('show')) {
        const activity = input.replace(/log that /i, '');
        const newLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: activity,
          time: new Date().toLocaleTimeString(),
          date: new Date().toISOString().split('T')[0]
        };
        const updatedLogs = [...logs, newLog];
        setLogs(updatedLogs);
        await saveData('tanyas_pa_logs', updatedLogs);
        response = `✅ Logged: "${activity}"`;

      } else if (userInput.includes('remind')) {
        const taskInput = input.replace(/remind me to /i, '').replace(/remind me /i, '');
        const parsed = parseTime(taskInput);

        const newReminder = {
          id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: parsed.task,
          time: parsed.time,
          date: parsed.date || new Date().toISOString().split('T')[0],
          dateWord: parsed.dateWord || 'today',
          done: false,
          notified: false,
          created: new Date().toLocaleTimeString()
        };

        const updatedReminders = [...reminders, newReminder];
        setReminders(updatedReminders);
        await saveData('tanyas_pa_reminders', updatedReminders);

        if (parsed.time) {
          const dateText = parsed.dateWord === 'tomorrow' ? 'tomorrow' : 'today';
          response = `✅ Mobile reminder set: "${parsed.task}" ${dateText} at ${parsed.time}. You'll get a push notification! 📱🔔`;
          
          // Schedule local notification
          const targetDate = new Date();
          if (parsed.dateWord === 'tomorrow') {
            targetDate.setDate(targetDate.getDate() + 1);
          }
          const [hours, minutes] = parsed.time.split(':');
          targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "🔔 Tanya's PA Reminder",
              body: parsed.task,
              sound: true,
            },
            trigger: { 
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: targetDate 
            },
          });
        } else {
          response = `✅ Reminder added: "${parsed.task}"`;
        }

      } else if (userInput.includes('demo') || userInput.includes('test')) {
        // Create a test reminder for 30 seconds from now
        const testTime = new Date();
        testTime.setSeconds(testTime.getSeconds() + 30);
        
        const testReminder = {
          id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: 'Demo notification test',
          time: testTime.toTimeString().slice(0, 5),
          date: testTime.toISOString().split('T')[0],
          dateWord: 'today',
          done: false,
          notified: false,
          created: new Date().toLocaleTimeString()
        };
        
        const updatedReminders = [...reminders, testReminder];
        setReminders(updatedReminders);
        await saveData('tanyas_pa_reminders', updatedReminders);
        response = `🧪 Demo test scheduled! You'll get a notification in 30 seconds.`;

      } else {
        response = `I can help you with:
• Log activities: "Log that I had breakfast"
• Set reminders: "Remind me at 6pm to call mom"
• Quick reminders: "Remind me in 5 minutes to check this"
• View data: "Show my logs" or "Show my reminders"
📱 This is your mobile app with real push notifications!`;
      }
    } finally {
      setIsLoading(false);
    }

    const newMessages = [...messages, `You: ${input}`, `Assistant: ${response}`];
    setMessages(newMessages);
    await saveData('tanyas_pa_messages', newMessages);
    setInput('');
  };

  const completeReminder = async (id) => {
    const updatedReminders = reminders.map(r => 
      r.id === id ? { ...r, done: true } : r
    );
    setReminders(updatedReminders);
    await saveData('tanyas_pa_reminders', updatedReminders);
    setMessages(prev => [...prev, 'Assistant: ✅ Reminder completed!']);
  };


  return (
    <GestureHandlerRootView style={styles.container}>
      <ExpoStatusBar style="light" backgroundColor="#4285f4" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👩‍💼 Tanya's PA</Text>
        <Text style={styles.headerSubtitle}>
          Mobile App • Push Notifications • {currentTime.toLocaleTimeString().slice(0, 5)}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>📝 {logs.length} logs</Text>
        <Text style={styles.statsText}>⏰ {reminders.filter(r => !r.done).length} reminders</Text>
        <Text style={styles.statsText}>✅ {reminders.filter(r => r.done).length} done</Text>
      </View>

      {/* Quick Actions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
        {[
          { id: 'log', title: '+ Log', action: () => setInput("Log that I "), color: '#e8f0fe' },
          { id: 'reminder', title: '+ Reminder', action: () => setInput("Remind me at 6pm to "), color: '#fef7e0' },
          { id: 'logs', title: '📋 Logs', action: () => setInput("Show my logs"), color: '#e6f4ea' },
          { id: 'reminders', title: '⏰ Reminders', action: () => setInput("Show my reminders"), color: '#fce8e6' },
          { id: 'test', title: '🧪 Test', action: () => setInput("Demo"), color: '#f3e8ff' }
        ].map((btn) => (
          <TouchableOpacity
            key={btn.id}
            style={[styles.quickActionButton, { backgroundColor: btn.color }]}
            onPress={btn.action}
          >
            <Text style={styles.quickActionText}>{btn.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map((msg, i) => (
          <View
            key={`message-${i}-${msg.slice(0, 20).replace(/\s+/g, '-')}`}
            style={[
              styles.messageBox,
              msg.includes('PUSH NOTIFICATION') && styles.alertMessage,
              msg.startsWith('You:') && styles.userMessage,
              msg.startsWith('Assistant:') && styles.assistantMessage,
            ]}
          >
            <Text style={styles.messageText}>{msg}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor="#666"
          multiline={false}
        />
        <TouchableOpacity 
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} 
          onPress={handleMessage}
          disabled={isLoading}
        >
          <Text style={styles.sendButtonText}>{isLoading ? "..." : "Send"}</Text>
        </TouchableOpacity>
      </View>

      {/* Active Reminders */}
      {reminders.filter(r => !r.done).length > 0 && (
        <ScrollView style={styles.remindersPanel} showsVerticalScrollIndicator={false}>
          <Text style={styles.remindersPanelTitle}>
            ⏰ Active Reminders ({reminders.filter(r => !r.done).length})
          </Text>
          {reminders.filter(r => !r.done).slice(0, 3).map((reminder, index) => (
            <View key={reminder.id || `reminder-${index}`} style={styles.reminderItem}>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderText}>{reminder.text}</Text>
                {reminder.time && (
                  <Text style={styles.reminderTime}>
                    {reminder.dateWord !== 'today' && `${reminder.dateWord} `}at {reminder.time}
                  </Text>
                )}
                {reminder.notified && (
                  <Text style={styles.alertedText}>✅ ALERTED</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => completeReminder(reminder.id)}
              >
                <Text style={styles.doneButtonText}>✓</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4285f4',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e3f2fd',
    marginTop: 5,
  },
  statsBar: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 14,
    color: '#333',
  },
  quickActions: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickActionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageBox: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  userMessage: {
    borderLeftColor: '#4285f4',
    backgroundColor: '#f0f8ff',
  },
  assistantMessage: {
    borderLeftColor: '#34a853',
    backgroundColor: '#f0fff0',
  },
  alertMessage: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
    borderLeftColor: '#f44336',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  inputContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 14,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  remindersPanel: {
    backgroundColor: 'white',
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#fbbc04',
  },
  remindersPanelTitle: {
    backgroundColor: '#fbbc04',
    color: '#202124',
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontWeight: '500',
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  reminderTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  alertedText: {
    fontSize: 12,
    color: '#137333',
    fontWeight: 'bold',
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: '#34a853',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
