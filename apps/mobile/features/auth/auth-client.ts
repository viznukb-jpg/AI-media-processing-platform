import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

import { env } from "@/shared/config/env";
import { authEventEmitter } from "@/shared/utils/event-emitter";

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

export const apiFetch = async <T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> => {
  const headers = new Headers(options?.headers);
  const isWrite = options?.method && ["POST", "PUT", "PATCH"].includes(options.method.toUpperCase());
  if (isWrite && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutMs = isWrite ? 30000 : 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Use authClient.$fetch with an absolute URL so it bypasses the /api/auth prefix
    // but still automatically attaches the session headers/cookies!
    const { data, error } = await authClient.$fetch<T>(
      `${env.apiBaseUrl}${endpoint}`,
      {
        ...options,
        // @ts-ignore
        signal: controller.signal,
        headers: Object.fromEntries(headers.entries()),
      },
    );

    if (error) {
      if (error.status === 401) {
        // Session expired — force sign out and redirect to login
        await signOut().catch(() => {});
        authEventEmitter.emit("session-expired");
      }
      throw new Error(error.message || "API Error");
    }

    return data as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};
