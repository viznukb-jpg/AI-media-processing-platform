import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useRouter } from "expo-router";
import { authClient } from "../../utils/auth-client";

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "You need to allow access to your photos to upload media.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadMedia = async () => {
    if (!imageUri) return;
    
    setIsUploading(true);
    setProgress(0);

    try {
      const fileName = imageUri.split('/').pop() || 'upload.jpg';
      const contentType = "image/jpeg"; // Simplified for this example

      // 1. Get Presigned URL
      const { data: urlData, error: urlError } = await authClient.$fetch<any>("/api/upload-url", {
        method: "POST",
        body: JSON.stringify({ filename: fileName, contentType }),
      });

      if (urlError || !urlData?.uploadUrl) {
        throw new Error(urlError?.message || "Failed to get upload URL");
      }

      // 2. Upload file to S3
      const response = await fetch(imageUri);
      const blob = await response.blob();

      await axios.put(urlData.uploadUrl, blob, {
        headers: { "Content-Type": contentType },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      });

      // 3. Create Job
      const { data: jobData, error: jobError } = await authClient.$fetch<any>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({ originalUrl: urlData.key }),
      });

      if (jobError || !jobData?.job) {
        throw new Error(jobError?.message || "Failed to create job");
      }

      Alert.alert("Success", "Media uploaded and job queued!");
      setImageUri(null);
      router.push(`/job/${jobData.job.id}`);
      
    } catch (err: any) {
      console.error(err);
      Alert.alert("Upload Error", err.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Media</Text>
      
      {!imageUri ? (
        <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
          <Text style={styles.pickButtonText}>Select Image from Gallery</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="blue" />
              <Text style={styles.progressText}>Uploading: {progress}%</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setImageUri(null)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={uploadMedia}>
                <Text style={styles.buttonText}>Upload to S3</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 30 },
  pickButton: { backgroundColor: "#e2e8f0", padding: 20, borderRadius: 10, width: "100%", alignItems: "center" },
  pickButtonText: { color: "blue", fontSize: 16, fontWeight: "500" },
  previewContainer: { width: "100%", alignItems: "center" },
  imagePreview: { width: 300, height: 300, borderRadius: 10, marginBottom: 20 },
  actionButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: 20 },
  uploadButton: { backgroundColor: "blue", padding: 15, borderRadius: 8, flex: 1, marginLeft: 10, alignItems: "center" },
  cancelButton: { backgroundColor: "gray", padding: 15, borderRadius: 8, flex: 1, marginRight: 10, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "bold" },
  uploadingContainer: { width: "100%", alignItems: "center" },
  progressText: { marginTop: 10, fontSize: 16, fontWeight: "bold" },
  progressBarContainer: { width: "100%", height: 10, backgroundColor: "#e2e8f0", borderRadius: 5, marginTop: 10 },
  progressBar: { height: "100%", backgroundColor: "blue", borderRadius: 5 },
});
