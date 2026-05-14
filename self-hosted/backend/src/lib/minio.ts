import { Client } from 'minio';

export const minio = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER!,
  secretKey: process.env.MINIO_ROOT_PASSWORD!,
  region: process.env.MINIO_REGION,
});

export const BUCKETS = {
  documents: 'documents',
  avatars: 'avatars',
  public: 'public',
} as const;

export const presignedUpload = (bucket: string, key: string, sec = 600) =>
  minio.presignedPutObject(bucket, key, sec);

export const presignedDownload = (bucket: string, key: string, sec = 600) =>
  minio.presignedGetObject(bucket, key, sec);