import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { glassmorphism } from '../styles/glassmorphism';
import { ReminderCardProps } from '../types';

const ReminderCard: React.FC<ReminderCardProps> = ({ 
  reminder, 
  onToggle, 
  onDelete, 
  style 
}) => {
  const cardStyle: ViewStyle = {
    ...glassmorphism.card,
    marginVertical: 8,
    marginHorizontal: 16,
    opacity: reminder.completed ? 0.7 : 1,
    ...style,
  };

  const titleStyle: TextStyle = {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textDecorationLine: reminder.completed ? 'line-through' : 'none',
  };

  const timeStyle: TextStyle = {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  };

  const dateStyle: TextStyle = {
    color: colors.textTertiary,
    fontSize: 12,
  };

  const actionButtonStyle: ViewStyle = {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: reminder.completed 
      ? colors.success + '20' 
      : colors.warning + '20',
  };

  const deleteButtonStyle: ViewStyle = {
    position: 'absolute',
    top: 12,
    right: 50,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.error + '20',
  };

  return (
    <View style={cardStyle}>
      {onToggle && (
        <TouchableOpacity 
          style={actionButtonStyle}
          onPress={() => onToggle(reminder.id)}
        >
          <Ionicons 
            name={reminder.completed ? "checkmark-circle" : "checkmark-circle-outline"} 
            size={16} 
            color={reminder.completed ? colors.success : colors.warning} 
          />
        </TouchableOpacity>
      )}
      
      {onDelete && (
        <TouchableOpacity 
          style={deleteButtonStyle}
          onPress={() => onDelete(reminder.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      )}
      
      <Text style={titleStyle}>{reminder.text}</Text>
      <Text style={timeStyle}>🔔 {reminder.time}</Text>
      <Text style={dateStyle}>
        📅 {reminder.date.toLocaleDateString()} at {reminder.date.toLocaleTimeString()}
      </Text>
      {reminder.completed && (
        <Text style={[dateStyle, { color: colors.success, marginTop: 4 }]}>
          ✅ Completed
        </Text>
      )}
    </View>
  );
};

export default ReminderCard;
