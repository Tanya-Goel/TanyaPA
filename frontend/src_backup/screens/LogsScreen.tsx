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
import LogCard from '../components/LogCard';
import { Log } from '../types';

const LogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      // For now, we'll use mock data since the backend doesn't have a direct logs endpoint
      // In a real app, you'd call: const response = await apiService.getLogs();
      const mockLogs: Log[] = [
        {
          id: 1,
          action: "Woke up and had breakfast",
          time: "7:30 AM",
          originalInput: "Log that I woke up at 7:30 AM",
          date: new Date(),
        },
        {
          id: 2,
          action: "Started work on the project",
          time: "9:00 AM",
          originalInput: "Log that I started work at 9:00 AM",
          date: new Date(),
        },
        {
          id: 3,
          action: "Had lunch with colleagues",
          time: "12:30 PM",
          originalInput: "Log that I had lunch at 12:30 PM",
          date: new Date(),
        },
      ];
      setLogs(mockLogs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLog = (id: number) => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLogs(prev => prev.filter(log => log.id !== id));
          },
        },
      ]
    );
  };

  const renderLog = ({ item }: { item: Log }) => (
    <LogCard log={item} onDelete={deleteLog} />
  );

  const renderEmptyState = () => (
    <GlassContainer style={styles.emptyState}>
      <Text style={styles.emptyTitle}>📝 No Logs Yet</Text>
      <Text style={styles.emptyText}>
        Start logging your activities by chatting with your assistant!
      </Text>
    </GlassContainer>
  );

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <GlassContainer style={styles.header}>
          <Text style={styles.title}>📝 Activity Logs</Text>
          <Text style={styles.subtitle}>
            {logs.length} {logs.length === 1 ? 'log' : 'logs'} recorded
          </Text>
        </GlassContainer>

        {isLoading ? (
          <GlassContainer style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading logs...</Text>
          </GlassContainer>
        ) : (
          <FlatList
            data={logs}
            renderItem={renderLog}
            keyExtractor={(item) => item.id.toString()}
            style={styles.logsList}
            contentContainerStyle={styles.logsContent}
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
  subtitle: {
    ...commonStyles.subtitle,
    textAlign: 'center',
  },
  logsList: {
    flex: 1,
  },
  logsContent: {
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

export default LogsScreen;
