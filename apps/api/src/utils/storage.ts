import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { HttpError } from './http-error.js';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const allowedTypes: Record<string, { type: string; maxSize: number; extensions: string[] }> = {
  pdf: { type: 'pdf', maxSize: 10 * 1024 * 1024, extensions: ['.pdf'] },
  video: { type: 'video', maxSize: 100 * 1024 * 1024, extensions: ['.mp4', '.mov', '.mkv'] },
  image: { type: 'image', maxSize: 10 * 1024 * 1024, extensions: ['.png', '.jpg', '.jpeg', '.webp'] },
  document: { type: 'document', maxSize: 10 * 1024 * 1024, extensions: ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'] },
  other: { type: 'other', maxSize: 10 * 1024 * 1024, extensions: [] }
};

function inferFileType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  const match = Object.values(allowedTypes).find((item) => item.extensions.includes(ext));
  return match?.type ?? 'other';
}

function ensureS3Config() {
  if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new HttpError(500, 'S3 configuration is missing');
  }
}

export function getPublicS3Url(key: string) {
  if (env.S3_PUBLIC_BASE_URL) return `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
}

function extractS3Key(fileUrl: string) {
  try {
    const url = new URL(fileUrl);
    let key = url.pathname.replace(/^\/+/, '');
    if (key.startsWith(`${env.S3_BUCKET}/`)) {
      key = key.replace(`${env.S3_BUCKET}/`, '');
    }
    return key;
  } catch {
    return null;
  }
}

export async function getSignedDownloadUrl(fileUrl: string, expiresIn = 900) {
  if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    return fileUrl;
  }
  const key = extractS3Key(fileUrl);
  if (!key) return fileUrl;

  const client = new S3Client({
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY
    }
  });

  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

export async function uploadToS3(payload: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  tenantId: string;
  onProgress?: (percent: number) => void;
}) {
  ensureS3Config();
  const fileType = inferFileType(payload.filename);
  const rules = allowedTypes[fileType];
  if (payload.size > rules.maxSize) {
    throw new HttpError(400, `File size exceeds limit for ${fileType}`);
  }

  const ext = path.extname(payload.filename).toLowerCase();
  if (rules.extensions.length > 0 && !rules.extensions.includes(ext)) {
    throw new HttpError(400, `Invalid file type for ${fileType}`);
  }

  const client = new S3Client({
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY
    }
  });

  const key = `tenants/${payload.tenantId}/materials/${randomUUID()}${ext || ''}`;
  const upload = new Upload({
    client,
    params: {
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: payload.buffer,
      ContentType: payload.mimeType
    }
  });

  if (payload.onProgress) {
    upload.on('httpUploadProgress', (progress) => {
      if (!progress.total) return;
      const percent = Math.round((progress.loaded / progress.total) * 100);
      payload.onProgress?.(percent);
    });
  }

  await upload.done();

  return {
    key,
    url: getPublicS3Url(key),
    fileType
  };
}
