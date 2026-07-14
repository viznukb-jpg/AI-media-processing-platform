import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signIn } from '../auth-client';
import { PasswordInput } from './PasswordInput';
import { Button } from '@/shared/components/Button';
import { colors } from '@/shared/theme/colors';

export const LoginForm = ({ onSwitchToRegister }: { onSwitchToRegister: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await signIn.email({
        email,
        password,
      });
      if (error) {
        Alert.alert("Login Failed", error.message);
      } else {
        router.replace("/");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      Alert.alert("Error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ width: '100%' }}>
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
      <Button 
        title="Sign In" 
        onPress={handleLogin}
        loading={isLoading}
        style={{ marginBottom: 15 }}
      />
      <Button 
        title="Switch to Register"
        onPress={onSwitchToRegister}
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
