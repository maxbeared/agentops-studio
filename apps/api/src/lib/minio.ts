import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.S3_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost',
  port: parseInt(process.env.S3_ENDPOINT?.split(':')[2] || '9000', 10),
  useSSL: false,
  accessKey: process.env.S3_ACCESS_KEY || 'minio',
  secretKey: process.env.S3_SECRET_KEY || 'minio123',
});

const BUCKET_NAME = process.env.S3_BUCKET || 'agentops';
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || `http://localhost:9000/${BUCKET_NAME}`;

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME);
    // Set bucket policy to allow public read access
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
  }
}

export async function uploadFile(
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await ensureBucket();

  const objectName = `${Date.now()}-${fileName}`;

  await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, { 'Content-Type': contentType });

  return objectName;
}

export async function getFileUrl(objectName: string): Promise<string> {
  return minioClient.presignedGetObject(BUCKET_NAME, objectName, 24 * 60 * 60);
}

export async function deleteFile(objectName: string): Promise<void> {
  await minioClient.removeObject(BUCKET_NAME, objectName);
}

export async function uploadAvatar(
  userId: string,
  base64Data: string
): Promise<string> {
  await ensureBucket();

  // Extract mime type and data from base64
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 format');
  }
  const mimeType = matches[1];
  const base64 = matches[2];
  const buffer = Buffer.from(base64, 'base64');

  // Use userId as object name for easy lookup
  const objectName = `avatars/${userId}`;

  // Delete existing avatar if any
  try {
    await minioClient.removeObject(BUCKET_NAME, objectName);
  } catch {
    // Ignore if doesn't exist
  }

  await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, { 'Content-Type': mimeType });

  return `${S3_PUBLIC_URL}/${objectName}`;
}

export { minioClient, BUCKET_NAME, S3_PUBLIC_URL };
