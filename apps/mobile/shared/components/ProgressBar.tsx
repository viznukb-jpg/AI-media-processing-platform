import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  value: number; // 0 to 100
  style?: ViewStyle;
};

export const ProgressBar = ({ value, style }: Props) => {
  const safeValue = Math.min(Math.max(value, 0), 100);
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.fill, { width: `${safeValue}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 10,
    backgroundColor: colors.secondary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
});
