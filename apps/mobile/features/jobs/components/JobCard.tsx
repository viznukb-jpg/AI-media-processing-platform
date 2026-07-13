import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Job } from '../types';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { colors } from '@/shared/theme/colors';

type Props = {
  job: Job;
  onPress: (id: string) => void;
};

export const JobCard = ({ job, onPress }: Props) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(job.id)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.jobId}>Job {job.id.slice(0, 8)}...</Text>
        <StatusBadge status={job.status} />
      </View>
      <Text style={styles.date}>{new Date(job.createdAt).toLocaleString()}</Text>
      
      <ProgressBar value={job.progress} style={styles.progressBar} />
      
      <Text style={styles.progressText}>{job.progress}%</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  jobId: {
    fontSize: 16,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  progressBar: {
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: "right",
  },
});
