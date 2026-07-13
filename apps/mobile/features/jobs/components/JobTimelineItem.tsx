import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JobEvent } from '../types';
import { colors } from '@/shared/theme/colors';

type Props = {
  item: JobEvent;
  isLast: boolean;
};

export const JobTimelineItem = ({ item, isLast }: Props) => {
  return (
    <View style={styles.eventRow}>
      <View style={styles.eventDot} />
      {!isLast && <View style={styles.eventLine} />}
      <View style={styles.eventContent}>
        <Text style={styles.eventStatus}>{item.status.toUpperCase()}</Text>
        {item.message && <Text style={styles.eventMessage}>{item.message}</Text>}
        <Text style={styles.eventTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  eventRow: {
    flexDirection: "row",
    marginBottom: 20,
    position: "relative",
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 5,
    marginRight: 15,
    zIndex: 2,
  },
  eventLine: {
    position: "absolute",
    left: 5,
    top: 15,
    bottom: -25,
    width: 2,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  eventContent: {
    flex: 1,
  },
  eventStatus: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  eventMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  eventTime: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 2,
  },
});
