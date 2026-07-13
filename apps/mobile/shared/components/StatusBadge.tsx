import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { JobStatus } from '@/features/jobs/types';
import { colors } from '../theme/colors';

type Props = {
  status: JobStatus | string;
  style?: TextStyle;
};

export const StatusBadge = ({ status, style }: Props) => {
  const statusColors = colors.status[status as JobStatus] || colors.status.default;

  return (
    <Text 
      style={[
        styles.badge, 
        { 
          backgroundColor: statusColors.bg, 
          color: statusColors.text 
        },
        style
      ]}
    >
      {status.toUpperCase()}
    </Text>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
    textAlign: 'center',
  },
});
