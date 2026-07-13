import Constants from 'expo-constants';

export const env = {
  apiBaseUrl: Constants.expoConfig?.extra?.apiBaseUrl as string,
  s3PublicBaseUrl: Constants.expoConfig?.extra?.s3PublicBaseUrl as string,
};
