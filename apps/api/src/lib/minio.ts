import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.S3_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost',
  port: parseInt(process.env.S3_ENDPOINT?.split(':')[2] || '9000', 10),
  useSSL: false,
  accessKey: process.env.S3_ACCESS_KEY || 'minio',
  secretKey: process.env.S3_SECRET_KEY || 'minio123',
});

const BUCKET_NAME = process.env.S3_BUCKET || 'agentops';

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME);
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

export { minioClient, BUCKET_NAME };
