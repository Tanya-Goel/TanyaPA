import React from 'react';
import { TextInput, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../styles/colors';
import { glassmorphism } from '../styles/glassmorphism';
import { GlassInputProps } from '../types';

const GlassInput: React.FC<GlassInputProps> = ({ 
  value, 
  onChangeText, 
  placeholder = '', 
  style, 
  multiline = false,
  numberOfLines = 1
}) => {
  const inputStyle: ViewStyle = {
    ...glassmorphism.input,
    ...style,
  };

  const textStyle: TextStyle = {
    color: colors.textPrimary,
    fontSize: 16,
    textAlignVertical: multiline ? 'top' : 'center',
  };

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      style={[inputStyle, textStyle]}
      multiline={multiline}
      numberOfLines={numberOfLines}
    />
  );
};

export default GlassInput;
