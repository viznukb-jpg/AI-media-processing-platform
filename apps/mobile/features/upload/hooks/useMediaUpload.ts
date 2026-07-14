import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { requestUploadUrl, createJob } from '../api/upload.api';

export const useMediaUpload = () => {
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
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const upload = async () => {
    if (!imageUri) return;
    
    setIsUploading(true);
    setProgress(0);

    try {
      const fileName = imageUri.split('/').pop() || 'upload.jpg';
      const ext = fileName.split('.').pop()?.toLowerCase();
      
      let contentType = 'application/octet-stream';
      if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'heic') contentType = 'image/heic';
      else if (ext === 'mp4') contentType = 'video/mp4';
      else if (ext === 'mov') contentType = 'video/quicktime';
      else if (ext === 'avi') contentType = 'video/x-msvideo';
      else if (ext === 'webm') contentType = 'video/webm';

      const urlData = await requestUploadUrl(fileName, contentType);

      if (!urlData?.uploadUrl) {
        throw new Error("Failed to get upload URL");
      }

      const uploadTask = FileSystem.createUploadTask(
        urlData.uploadUrl,
        imageUri,
        {
          httpMethod: 'PUT',
          headers: { 'Content-Type': contentType },
        },
        (progressEvent) => {
          if (progressEvent.totalBytesExpectedToSend) {
            const percentCompleted = Math.round((progressEvent.totalBytesSent * 100) / progressEvent.totalBytesExpectedToSend);
            setProgress(percentCompleted);
          }
        }
      );

      const response = await uploadTask.uploadAsync();
      
      if (response?.status !== 200) {
        throw new Error(`Upload failed with status ${response?.status}`);
      }

      const jobData = await createJob(urlData.key);

      if (!jobData?.job) {
        throw new Error("Failed to create job");
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

  const reset = () => {
    setImageUri(null);
    setProgress(0);
    setIsUploading(false);
  };

  return {
    imageUri,
    isUploading,
    progress,
    pickImage,
    upload,
    reset,
  };
};
