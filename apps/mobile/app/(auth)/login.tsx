import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { signIn, signUp } from "../../utils/auth-client";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (isLogin) {
        const { data, error } = await signIn.email({
          email,
          password,
        });
        if (error) {
          Alert.alert("Login Failed", error.message);
        } else {
          Alert.alert("Success", "Logged in successfully!");
          router.replace("/");
        }
      } else {
        const { data, error } = await signUp.email({
          email,
          password,
          name: name || "User",
        });
        if (error) {
          Alert.alert("Registration Failed", error.message);
        } else {
          Alert.alert("Success", "Registered successfully!");
          router.replace("/");
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected error occurred");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? "Login" : "Register"}</Text>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.buttonContainer}>
        <Button title={isLogin ? "Sign In" : "Sign Up"} onPress={handleAuth} />
      </View>

      <Button
        title={`Switch to ${isLogin ? "Register" : "Login"}`}
        onPress={() => setIsLogin(!isLogin)}
        color="gray"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  buttonContainer: { marginBottom: 10 },
});
