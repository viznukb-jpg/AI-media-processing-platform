import { env } from '../config/env';

export const getS3Url = (key: string) => {
  return `${env.s3PublicBaseUrl}/${key}`;
};
