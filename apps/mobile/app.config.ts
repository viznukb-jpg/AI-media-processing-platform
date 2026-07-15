import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: config.name || 'mobile',
    slug: config.slug || 'mobile',
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    },
  };
};
