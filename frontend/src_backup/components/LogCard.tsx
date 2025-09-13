import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { glassmorphism } from '../styles/glassmorphism';
import { LogCardProps } from '../types';

const LogCard: React.FC<LogCardProps> = ({ log, onDelete, style }) => {
  const cardStyle: ViewStyle = {
    ...glassmorphism.card,
    marginVertical: 8,
    marginHorizontal: 16,
    ...style,
  };

  const titleStyle: TextStyle = {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  };

  const timeStyle: TextStyle = {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  };

  const dateStyle: TextStyle = {
    color: colors.textTertiary,
    fontSize: 12,
  };

  const deleteButtonStyle: ViewStyle = {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.error + '20',
  };

  return (
    <View style={cardStyle}>
      {onDelete && (
        <TouchableOpacity 
          style={deleteButtonStyle}
          onPress={() => onDelete(log.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      )}
      
      <Text style={titleStyle}>{log.action}</Text>
      <Text style={timeStyle}>⏰ {log.time}</Text>
      <Text style={dateStyle}>
        📅 {log.date.toLocaleDateString()} at {log.date.toLocaleTimeString()}
      </Text>
    </View>
  );
};

export default LogCard;
