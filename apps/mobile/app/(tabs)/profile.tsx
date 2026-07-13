import React from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { useSession, signOut } from "../../utils/auth-client";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to log out");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      {session?.user && (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{session.user.name}</Text>
          
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{session.user.email}</Text>
        </View>
      )}

      <Button title="Logout" onPress={handleLogout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 30 },
  infoContainer: { width: "100%", backgroundColor: "white", padding: 20, borderRadius: 10, marginBottom: 30, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  label: { fontSize: 14, color: "gray", marginBottom: 5 },
  value: { fontSize: 18, fontWeight: "500", marginBottom: 15 },
});
