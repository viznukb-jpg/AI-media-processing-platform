import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signIn, signUp } from '../auth-client';
import { PasswordInput } from '../components/PasswordInput';
import { Button } from '@/shared/components/Button';
import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { colors } from '@/shared/theme/colors';

export const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    setIsLoading(true);
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
        if (password !== confirmPassword) {
          Alert.alert("Registration Failed", "Passwords do not match");
          return;
        }

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer center>
      <View style={{ width: '100%' }}>
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

        <PasswordInput 
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        {!isLogin && (
          <PasswordInput 
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
        )}

        <Button 
          title={isLogin ? "Sign In" : "Sign Up"} 
          onPress={handleAuth}
          loading={isLoading}
          style={{ marginBottom: 15 }}
        />

        <Button 
          title={`Switch to ${isLogin ? "Register" : "Login"}`}
          onPress={() => setIsLogin(!isLogin)}
          variant="secondary"
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: colors.background.card,
  },
});
