import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
};

export const PasswordInput = ({ placeholder, value, onChangeText, showPassword, onTogglePassword }: Props) => {
  return (
    <View style={styles.passwordContainer}>
      <TextInput
        style={styles.passwordInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        textContentType="oneTimeCode"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
        <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: colors.background.card,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
  },
  eyeIcon: {
    padding: 10,
  },
});
