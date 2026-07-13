import { JobStatus } from '@/features/jobs/types';

export const colors = {
  primary: "#007BFF",
  danger: "#FF3B30",
  secondary: "#e2e8f0",
  text: {
    primary: "#333333",
    secondary: "gray",
    light: "#ffffff",
  },
  background: {
    main: "#f5f5f5",
    card: "#ffffff",
  },
  status: {
    queued: { bg: "#e2e8f0", text: "#475569" },
    downloading: { bg: "#dbeafe", text: "#1e40af" },
    analyzing: { bg: "#fef08a", text: "#854d0e" },
    generating_thumbnail: { bg: "#fed7aa", text: "#9a3412" },
    completed: { bg: "#bbf7d0", text: "#166534" },
    failed: { bg: "#fecaca", text: "#991b1b" },
    default: { bg: "#e2e8f0", text: "#475569" },
  } as Record<JobStatus | "default", { bg: string; text: string }>,
  border: "#ccc",
};
