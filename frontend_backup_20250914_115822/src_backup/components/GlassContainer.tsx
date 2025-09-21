import React from 'react';
import { View, ViewStyle } from 'react-native';
import { glassmorphism } from '../styles/glassmorphism';
import { GlassContainerProps } from '../types';

const GlassContainer: React.FC<GlassContainerProps> = ({ 
  children, 
  style, 
  light = false, 
  dark = false 
}) => {
  const getGlassStyle = (): ViewStyle => {
    if (light) return glassmorphism.containerLight;
    if (dark) return glassmorphism.containerDark;
    return glassmorphism.container;
  };

  return (
    <View style={[getGlassStyle(), style]}>
      {children}
    </View>
  );
};

export default GlassContainer;
