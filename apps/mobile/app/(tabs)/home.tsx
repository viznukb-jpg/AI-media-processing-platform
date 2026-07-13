import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { authClient } from "../../utils/auth-client";

// Define the Job type
type Job = {
  id: string;
  status: string;
  progress: number;
  originalUrl: string;
  createdAt: string;
};

const fetchJobs = async (): Promise<Job[]> => {
  // authClient.$fetch automatically includes the session token for React Native
  const { data, error } = await authClient.$fetch<any>("/api/jobs");
  if (error) {
    throw new Error(error.message || "Failed to fetch jobs");
  }
  return data?.jobs || [];
};

export default function HomeScreen() {
  const router = useRouter();
  
  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  const renderItem = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/job/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.jobId}>Job {item.id.slice(0, 8)}...</Text>
        <Text style={[styles.statusBadge, styles[`status_${item.status}` as keyof typeof styles] || styles.status_default]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{item.progress}%</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading jobs: {error.message}</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={<Text style={styles.emptyText}>No jobs found. Upload some media!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16 },
  card: { backgroundColor: "white", padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  jobId: { fontSize: 16, fontWeight: "600" },
  date: { fontSize: 12, color: "gray", marginBottom: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 10, fontWeight: "bold", overflow: "hidden" },
  status_queued: { backgroundColor: "#e2e8f0", color: "#475569" },
  status_downloading: { backgroundColor: "#dbeafe", color: "#1e40af" },
  status_analyzing: { backgroundColor: "#fef08a", color: "#854d0e" },
  status_generating_thumbnail: { backgroundColor: "#fed7aa", color: "#9a3412" },
  status_completed: { backgroundColor: "#bbf7d0", color: "#166534" },
  status_failed: { backgroundColor: "#fecaca", color: "#991b1b" },
  status_default: { backgroundColor: "#e2e8f0", color: "#475569" },
  progressBarContainer: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, marginBottom: 4 },
  progressBar: { height: "100%", backgroundColor: "blue", borderRadius: 3 },
  progressText: { fontSize: 12, color: "gray", textAlign: "right" },
  errorText: { color: "red", marginBottom: 10 },
  retryBtn: { padding: 10, backgroundColor: "blue", borderRadius: 5 },
  retryText: { color: "white" },
  emptyText: { textAlign: "center", color: "gray", marginTop: 20 },
});
