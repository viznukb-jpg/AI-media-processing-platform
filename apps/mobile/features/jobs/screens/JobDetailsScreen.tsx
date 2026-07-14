import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useJobQuery } from "../hooks/useJobQuery";
import { deleteJob } from "../api/jobs.api";
import { JobTimeline } from "../components/JobTimeline";
import { ScreenContainer } from "@/shared/components/ScreenContainer";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { ProgressBar } from "@/shared/components/ProgressBar";
import { Button } from "@/shared/components/Button";
import { colors } from "@/shared/theme/colors";

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
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Job Progress</Text>
          <StatusBadge status={job.status} />
        </View>

        <View style={styles.progressSection}>
          <ProgressBar value={job.progress} style={{ marginBottom: 8 }} />
          <Text style={styles.progressText}>{job.progress}% Completed</Text>
        </View>

        {job.status === "completed" && job.signedProcessedUrl && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Result (Thumbnail):</Text>
            <Image
              source={{ uri: job.signedProcessedUrl }}
              style={styles.resultImage}
            />
          </View>
        )}

        {job.events && <JobTimeline events={job.events} />}

        <View style={{ padding: 20 }}>
          <Button
            title="Delete Job"
            onPress={() => {
              Alert.alert(
                "Delete Job",
                "Are you sure you want to delete this job and all its files? This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await deleteJob(job.id);
                        router.replace("/(tabs)/home");
                      } catch (err) {
                        const errorMsg = err instanceof Error ? err.message : "Failed to delete job";
                        Alert.alert(
                          "Error",
                          errorMsg,
                        );
                      }
                    },
                  },
                ],
              );
            }}
            variant="danger"
          />
        </View>
      </ScrollView>
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
