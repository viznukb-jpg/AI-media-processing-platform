import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: config.name || 'mobile',
    slug: config.slug || 'mobile',
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.88.188:3000',
      s3PublicBaseUrl: process.env.EXPO_PUBLIC_S3_URL || 'http://192.168.88.188:9000/ai-media-platform-dev',
    },
  };
};
