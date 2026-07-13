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
