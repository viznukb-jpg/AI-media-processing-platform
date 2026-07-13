import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: "http://192.168.88.188:3000",
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
  const { data, error } = await authClient.$fetch<any>(`http://192.168.88.188:3000${endpoint}`, {
    ...options,
  });

  if (error) {
    throw new Error(error.message || "API Error");
  }

  return data;
};
