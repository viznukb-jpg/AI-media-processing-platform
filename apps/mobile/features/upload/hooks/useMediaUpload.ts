import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { requestUploadUrl, createJob } from "../api/upload.api";
import { getContentTypeFromFilename } from "../../../shared/utils/media-type.util";

export const useMediaUpload = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    setError(null);
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      setError(
        "Permission required: You need to allow access to your photos to upload media.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const upload = async () => {
    if (!imageUri) return null;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const fileName = imageUri.split("/").pop() || "upload.jpg";
      const contentType = getContentTypeFromFilename(fileName);

      let finalUri = imageUri;

      // Optimize image
      if (contentType.startsWith("image/")) {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1920 } }], // Resize longest side, maintain aspect ratio
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
        );
        finalUri = manipResult.uri;
      }

      // Get file size for server-side validation
      const fileInfo = await FileSystem.getInfoAsync(finalUri);
      if (!fileInfo.exists || !("size" in fileInfo)) {
        throw new Error("Could not read file info");
      }
      const fileSize = fileInfo.size;

      const urlData = await requestUploadUrl(fileName, contentType, fileSize);

      if (!urlData?.uploadUrl) {
        throw new Error("Failed to get upload URL");
      }

      const uploadTask = FileSystem.createUploadTask(
        urlData.uploadUrl,
        finalUri,
        {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file",
          parameters: urlData.fields || {},
        },
        (progressEvent) => {
          if (progressEvent.totalBytesExpectedToSend) {
            const percentCompleted = Math.round(
              (progressEvent.totalBytesSent * 100) /
                progressEvent.totalBytesExpectedToSend,
            );
            setProgress(percentCompleted);
          }
        },
      );

      const response = await uploadTask.uploadAsync();

      if (response?.status !== 200 && response?.status !== 204) {
        throw new Error(`Upload failed with status ${response?.status}`);
      }

      const jobData = await createJob(urlData.key);

      if (!jobData?.job) {
        throw new Error("Failed to create job");
      }

      setImageUri(null);
      return jobData.job.id;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setImageUri(null);
    setProgress(0);
    setIsUploading(false);
    setError(null);
  };

  return {
    imageUri,
    isUploading,
    progress,
    error,
    pickImage,
    upload,
    reset,
  };
};
