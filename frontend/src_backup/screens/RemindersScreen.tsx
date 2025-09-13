import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { commonStyles } from '../styles/glassmorphism';
import GlassContainer from '../components/GlassContainer';
import ReminderCard from '../components/ReminderCard';
import { Reminder } from '../types';

const RemindersScreen: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      // For now, we'll use mock data since the backend doesn't have a direct reminders endpoint
      // In a real app, you'd call: const response = await apiService.getReminders();
      const mockReminders: Reminder[] = [
        {
          id: 1,
          text: "Call mom",
          time: "9:00 PM",
          originalInput: "Remind me to call mom at 9 PM",
          date: new Date(),
          completed: false,
        },
        {
          id: 2,
          text: "Buy groceries",
          time: "6:00 PM",
          originalInput: "Remind me to buy groceries at 6 PM",
          date: new Date(),
          completed: true,
        },
        {
          id: 3,
          text: "Finish project report",
          time: "11:59 PM",
          originalInput: "Remind me to finish project report at 11:59 PM",
          date: new Date(),
          completed: false,
        },
      ];
      setReminders(mockReminders);
    } catch (error) {
      Alert.alert('Error', 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReminder = (id: number) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      )
    );
  };

  const deleteReminder = (id: number) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setReminders(prev => prev.filter(reminder => reminder.id !== id));
          },
        },
      ]
    );
  };

  const renderReminder = ({ item }: { item: Reminder }) => (
    <ReminderCard
      reminder={item}
      onToggle={toggleReminder}
      onDelete={deleteReminder}
    />
  );

  const renderEmptyState = () => (
    <GlassContainer style={styles.emptyState}>
      <Text style={styles.emptyTitle}>🔔 No Reminders Yet</Text>
      <Text style={styles.emptyText}>
        Set reminders by chatting with your assistant!
      </Text>
    </GlassContainer>
  );

  const completedCount = reminders.filter(r => r.completed).length;
  const pendingCount = reminders.length - completedCount;

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <GlassContainer style={styles.header}>
          <Text style={styles.title}>🔔 Reminders</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              📋 {pendingCount} pending • ✅ {completedCount} completed
            </Text>
          </View>
        </GlassContainer>

        {isLoading ? (
          <GlassContainer style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </GlassContainer>
        ) : (
          <FlatList
            data={reminders}
            renderItem={renderReminder}
            keyExtractor={(item) => item.id.toString()}
            style={styles.remindersList}
            contentContainerStyle={styles.remindersContent}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  header: {
    margin: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    ...commonStyles.title,
    marginBottom: 8,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    ...commonStyles.subtitle,
    textAlign: 'center',
    fontSize: 16,
  },
  remindersList: {
    flex: 1,
  },
  remindersContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    margin: 16,
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    ...commonStyles.body,
    textAlign: 'center',
  },
  emptyState: {
    margin: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    ...commonStyles.title,
    marginBottom: 16,
  },
  emptyText: {
    ...commonStyles.body,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default RemindersScreen;
