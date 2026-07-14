import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { Button } from '@/shared/components/Button';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { colors } from '@/shared/theme/colors';

export const UploadScreen = () => {
  const { imageUri, isUploading, progress, pickImage, upload, reset } = useMediaUpload();

  return (
    <ScreenContainer center>
      <Text style={styles.title}>Upload Media</Text>
      
      {!imageUri ? (
        <Button 
          title="Select Image from Gallery" 
          onPress={pickImage} 
          variant="secondary"
          style={styles.pickButton}
          textStyle={{ color: colors.primary }}
        />
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.progressText}>Uploading: {progress}%</Text>
              <ProgressBar value={progress} style={{ marginTop: 10 }} />
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <Button 
                title="Cancel" 
                onPress={reset} 
                variant="danger" 
                style={{ flex: 1, marginRight: 10 }} 
              />
              <Button 
                title="Upload to S3" 
                onPress={upload} 
                variant="primary" 
                style={{ flex: 1, marginLeft: 10 }} 
              />
            </View>
          )}
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  pickButton: {
    backgroundColor: colors.secondary,
    width: "100%",
  },
  previewContainer: {
    width: "100%",
    alignItems: "center",
  },
  imagePreview: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  uploadingContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
});
