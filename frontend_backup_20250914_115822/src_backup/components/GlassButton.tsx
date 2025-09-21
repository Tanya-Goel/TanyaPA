import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { glassmorphism } from '../styles/glassmorphism';
import { GlassButtonProps } from '../types';

const GlassButton: React.FC<GlassButtonProps> = ({ 
  title, 
  onPress, 
  style, 
  disabled = false, 
  variant = 'primary' 
}) => {
  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'secondary':
        return [colors.secondary, colors.secondaryDark];
      case 'accent':
        return [colors.accent, colors.accentDark];
      default:
        return [colors.primary, colors.primaryDark];
    }
  };

  const buttonStyle: ViewStyle = {
    ...glassmorphism.button,
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  const textStyle: TextStyle = {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled}
      style={buttonStyle}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 25,
          paddingVertical: 12,
          paddingHorizontal: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={textStyle}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default GlassButton;
