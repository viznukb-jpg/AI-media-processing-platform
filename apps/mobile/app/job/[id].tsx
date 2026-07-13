import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, Button } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { authClient, apiFetch } from "../../utils/auth-client";

type JobEvent = {
  id: string;
  status: string;
  message: string | null;
  timestamp: string;
};

type Job = {
  id: string;
  status: string;
  progress: number;
  originalUrl: string;
  processedUrl: string | null;
  events: JobEvent[];
  createdAt: string;
};

const fetchJobDetails = async (id: string): Promise<Job> => {
  const data = await apiFetch(`/api/jobs/${id}`);
  return data?.job;
};

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => fetchJobDetails(id as string),
    // Polling every 2 seconds if the job is not yet completed or failed
    refetchInterval: (query) => {
      const currentStatus = query.state?.data?.status;
      if (currentStatus === "completed" || currentStatus === "failed") {
        return false; // Stop polling
      }
      return 2000; // Poll every 2s
    },
  });

  const getS3Url = (key: string) => {
    // In a real app, you might want to fetch a signed GET url,
    // or if the bucket is public for read, just use the endpoint.
    // Assuming bucket allows public read or we use a proxy.
    // For this demo, let's just construct the MinIO URL.
    return `http://192.168.88.188:9000/ai-media-platform-dev/${key}`;
  };

  const renderEvent = ({ item, index }: { item: JobEvent, index: number }) => (
    <View style={styles.eventRow}>
      <View style={styles.eventDot} />
      {index !== (job?.events.length || 0) - 1 && <View style={styles.eventLine} />}
      <View style={styles.eventContent}>
        <Text style={styles.eventStatus}>{item.status.toUpperCase()}</Text>
        {item.message && <Text style={styles.eventMessage}>{item.message}</Text>}
        <Text style={styles.eventTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
    </View>
  );

  if (isLoading && !job) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="blue" />
        <Text style={{ marginTop: 10 }}>Loading job details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  if (!job) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Progress</Text>
        <Text style={[styles.statusBadge, styles[`status_${job.status}` as keyof typeof styles] || styles.status_default]}>
          {job.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${job.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{job.progress}% Completed</Text>
      </View>

      {job.status === "completed" && job.processedUrl && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result (Thumbnail):</Text>
          <Image source={{ uri: getS3Url(job.processedUrl) }} style={styles.resultImage} />
        </View>
      )}

      <Text style={styles.timelineTitle}>Timeline</Text>
      <FlatList
        data={job.events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.timelineList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  title: { fontSize: 20, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, fontSize: 12, fontWeight: "bold", overflow: "hidden" },
  status_queued: { backgroundColor: "#e2e8f0", color: "#475569" },
  status_downloading: { backgroundColor: "#dbeafe", color: "#1e40af" },
  status_analyzing: { backgroundColor: "#fef08a", color: "#854d0e" },
  status_generating_thumbnail: { backgroundColor: "#fed7aa", color: "#9a3412" },
  status_completed: { backgroundColor: "#bbf7d0", color: "#166534" },
  status_failed: { backgroundColor: "#fecaca", color: "#991b1b" },
  status_default: { backgroundColor: "#e2e8f0", color: "#475569" },
  progressSection: { padding: 20 },
  progressBarContainer: { height: 10, backgroundColor: "#e2e8f0", borderRadius: 5, marginBottom: 8 },
  progressBar: { height: "100%", backgroundColor: "blue", borderRadius: 5 },
  progressText: { textAlign: "right", color: "gray", fontSize: 14, fontWeight: "bold" },
  resultContainer: { padding: 20, alignItems: "center", backgroundColor: "#f8fafc", marginHorizontal: 20, borderRadius: 10 },
  resultTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  resultImage: { width: 200, height: 200, borderRadius: 8 },
  timelineTitle: { fontSize: 18, fontWeight: "bold", paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },
  timelineList: { paddingHorizontal: 20, paddingBottom: 30 },
  eventRow: { flexDirection: "row", marginBottom: 20, position: "relative" },
  eventDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "blue", marginTop: 5, marginRight: 15, zIndex: 2 },
  eventLine: { position: "absolute", left: 5, top: 15, bottom: -25, width: 2, backgroundColor: "#e2e8f0", zIndex: 1 },
  eventContent: { flex: 1 },
  eventStatus: { fontSize: 16, fontWeight: "600", color: "#333" },
  eventMessage: { fontSize: 14, color: "#666", marginTop: 2 },
  eventTime: { fontSize: 12, color: "#aaa", marginTop: 2 },
  errorText: { color: "red", fontSize: 16, marginBottom: 15 },
});
