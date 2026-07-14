import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signUp } from '../auth-client';
import { PasswordInput } from './PasswordInput';
import { Button } from '@/shared/components/Button';
import { colors } from '@/shared/theme/colors';

export const RegisterForm = ({ onSwitchToLogin }: { onSwitchToLogin: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Registration Failed", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await signUp.email({
        email,
        password,
        name: name || "User",
      });
      if (error) {
        Alert.alert("Registration Failed", error.message);
      } else {
        router.replace("/");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ width: '100%' }}>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
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
      <PasswordInput 
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />
      <Button 
        title="Sign Up" 
        onPress={handleRegister}
        loading={isLoading}
        style={{ marginBottom: 15 }}
      />
      <Button 
        title="Switch to Login"
        onPress={onSwitchToLogin}
        variant="secondary"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: colors.background.card,
  },
});
