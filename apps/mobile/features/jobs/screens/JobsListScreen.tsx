import React from 'react';
import { FlatList, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useJobsQuery } from '../hooks/useJobsQuery';
import { JobCard } from '../components/JobCard';
import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/Button';
import { colors } from '@/shared/theme/colors';

export const JobsListScreen = () => {
  const router = useRouter();
  const { data: jobs, isLoading, error, refetch } = useJobsQuery();

  if (isLoading) {
    return (
      <ScreenContainer center>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer center>
        <Text style={{ color: colors.danger, marginBottom: 10 }}>
          Error loading jobs: {error.message}
        </Text>
        <Button title="Retry" onPress={() => refetch()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={(id) => router.push(`/job/${id}`)} />
        )}
        contentContainerStyle={{ padding: 16 }}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={<EmptyState message="No jobs found. Upload some media!" />}
      />
    </ScreenContainer>
  );
};
