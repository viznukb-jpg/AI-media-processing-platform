import React, { useCallback, useMemo } from 'react';
import { FlatList, ActivityIndicator, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useJobsQuery } from '../hooks/useJobsQuery';
import { JobCard } from '../components/JobCard';
import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/Button';
import { colors } from '@/shared/theme/colors';
import { Job } from '../types';

export const JobsListScreen = () => {
  const router = useRouter();
  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useJobsQuery();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const jobs = useMemo(() => {
    if (!data) return [];
    return data.pages.flat();
  }, [data]);

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return <ActivityIndicator style={{ margin: 20 }} size="small" color={colors.primary} />;
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading && !data) {
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
        keyExtractor={(item: Job) => item.id}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={(id) => router.push(`/job/${id}`)} />
        )}
        contentContainerStyle={{ padding: 16 }}
        refreshing={isLoading && !isFetchingNextPage}
        onRefresh={refetch}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={<EmptyState message="No jobs found. Upload some media!" />}
      />
    </ScreenContainer>
  );
};
