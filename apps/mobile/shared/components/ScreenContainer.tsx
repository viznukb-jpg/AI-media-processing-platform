import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  center?: boolean;
};

export const ScreenContainer = ({ children, style, center }: Props) => {
  return (
    <View style={[
      styles.container, 
      center && styles.centered,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
