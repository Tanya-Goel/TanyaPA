import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { glassmorphism } from '../styles/glassmorphism';
import { MessageBubbleProps } from '../types';

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, style }) => {
  const isUser = message.isUser;

  const bubbleStyle: ViewStyle = {
    ...glassmorphism.containerLight,
    maxWidth: '80%',
    marginVertical: 4,
    marginHorizontal: 16,
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    ...style,
  };

  const textStyle: TextStyle = {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  };

  const timeStyle: TextStyle = {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 4,
    textAlign: isUser ? 'right' : 'left',
  };

  const getGradientColors = (): string[] => {
    if (isUser) {
      return [colors.primary, colors.primaryDark];
    }
    return [colors.glass, colors.glassDark];
  };

  return (
    <View style={bubbleStyle}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 12,
        }}
      >
        <Text style={textStyle}>{message.text}</Text>
        <Text style={timeStyle}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </LinearGradient>
    </View>
  );
};

export default MessageBubble;
