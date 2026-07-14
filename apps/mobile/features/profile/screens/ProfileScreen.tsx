import React from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSession,
  signOut,
  authClient,
  apiFetch,
} from "../../auth/auth-client";
import { ScreenContainer } from "@/shared/components/ScreenContainer";
import { Button } from "@/shared/components/Button";
import { colors } from "@/shared/theme/colors";

export const ProfileScreen = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const queryClient = useQueryClient();

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            queryClient.clear();
            router.replace("/(auth)/login");
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to log out");
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiFetch("/api/user/delete", { method: "DELETE" });
              // Also call signOut locally to make sure SecureStore is cleared
              try {
                await signOut();
              } catch (e) {}
              queryClient.clear();
              router.replace("/(auth)/login");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete account");
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer center>
      <View style={{ width: "100%" }}>
        <Text style={styles.title}>Profile</Text>

        {session?.user && (
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{session.user.name}</Text>

            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{session.user.email}</Text>
          </View>
        )}

        <Button
          title="Logout"
          onPress={handleLogout}
          style={{ width: "100%", marginBottom: 15 }}
        />

        <Button
          title="Delete Account"
          onPress={handleDeleteAccount}
          variant="danger"
          style={{ width: "100%" }}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  infoContainer: {
    width: "100%",
    backgroundColor: colors.background.card,
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 15,
  },
});
