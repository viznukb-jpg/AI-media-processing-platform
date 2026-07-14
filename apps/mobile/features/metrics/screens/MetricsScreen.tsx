import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../auth/auth-client';
import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { colors } from '@/shared/theme/colors';

interface MetricsData {
  total: number;
  totalUsers: number;
  activeJobs: number;
  statusBreakdown: Record<string, number>;
}

export const MetricsScreen = () => {
  const { data: metrics, isLoading: isMetricsLoading, error, refetch } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      return await apiFetch<MetricsData>('/api/metrics');
    },
    refetchInterval: 30000, // 30 seconds
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <ScreenContainer center>
      <View style={{ width: '100%' }}>
        <Text style={styles.title}>System Metrics</Text>
        
        <View style={styles.infoContainer}>
          {isMetricsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : error ? (
            <Text style={styles.errorText}>Failed to load metrics: {error.message}</Text>
          ) : metrics ? (
            <>
              <Text style={styles.label}>Total Registered Users:</Text>
              <Text style={styles.value}>{metrics.totalUsers}</Text>

              <Text style={styles.label}>Active In-Progress Jobs:</Text>
              <Text style={styles.value}>{metrics.activeJobs}</Text>
              
              <Text style={styles.label}>Total Jobs Processed:</Text>
              <Text style={styles.value}>{metrics.total}</Text>
              
              <Text style={styles.label}>Status Breakdown:</Text>
              {Object.entries(metrics.statusBreakdown || {}).map(([status, count]) => (
                <Text key={status} style={styles.value}>
                  - {status}: {String(count)}
                </Text>
              ))}
            </>
          ) : (
            <Text style={styles.label}>Failed to load metrics</Text>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: 'center',
  },
  infoContainer: {
    width: "100%",
    backgroundColor: colors.background.card,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 15,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  }
});
