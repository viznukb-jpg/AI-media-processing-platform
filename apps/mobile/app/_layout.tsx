import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "@/features/auth/auth-client";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { data: session, isPending } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace("/(tabs)/home");
    }
  }, [session, isPending, segments]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="job/[id]" options={{ title: "Job Details", headerShown: true }} />
      </Stack>
    </QueryClientProvider>
  );
}
