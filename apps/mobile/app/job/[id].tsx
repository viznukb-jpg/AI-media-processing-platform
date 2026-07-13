import { useLocalSearchParams } from "expo-router";
import { JobDetailsScreen } from "@/features/jobs/screens/JobDetailsScreen";

export default function JobScreen() {
  const { id } = useLocalSearchParams();
  return <JobDetailsScreen id={id as string} />;
}
