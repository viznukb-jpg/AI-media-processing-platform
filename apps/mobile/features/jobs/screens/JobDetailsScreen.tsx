import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useJobQuery } from '../hooks/useJobQuery';
import { JobTimeline } from '../components/JobTimeline';
import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { Button } from '@/shared/components/Button';
import { getS3Url } from '@/shared/utils/storage-url';
import { colors } from '@/shared/theme/colors';

type Props = {
  id: string;
};

export const JobDetailsScreen = ({ id }: Props) => {
  const router = useRouter();
  const { data: job, isLoading, error } = useJobQuery(id);

  if (isLoading && !job) {
    return (
      <ScreenContainer center>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading job details...</Text>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer center>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  if (!job) return null;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Job Progress</Text>
        <StatusBadge status={job.status} />
      </View>

      <View style={styles.progressSection}>
        <ProgressBar value={job.progress} style={{ marginBottom: 8 }} />
        <Text style={styles.progressText}>{job.progress}% Completed</Text>
      </View>

      {job.status === "completed" && job.processedUrl && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result (Thumbnail):</Text>
          <Image source={{ uri: getS3Url(job.processedUrl) }} style={styles.resultImage} />
        </View>
      )}

      {job.events && <JobTimeline events={job.events} />}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  progressSection: {
    padding: 20,
  },
  progressText: {
    textAlign: "right",
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "bold",
  },
  resultContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    marginHorizontal: 20,
    borderRadius: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    marginBottom: 15,
  },
});
