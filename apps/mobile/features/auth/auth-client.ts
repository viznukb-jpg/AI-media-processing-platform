import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

import { env } from "@/shared/config/env";

export const authClient = createAuthClient({
  baseURL: env.apiBaseUrl,
  plugins: [
    expoClient({
      scheme: "ai-media-platform",
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signUp, useSession, signOut } = authClient;

export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  // Use authClient.$fetch with an absolute URL so it bypasses the /api/auth prefix
  // but still automatically attaches the session headers/cookies!
  const { data, error } = await authClient.$fetch<any>(`${env.apiBaseUrl}${endpoint}`, {
    ...options,
  });

  if (error) {
    throw new Error(error.message || "API Error");
  }

  return data;
};
