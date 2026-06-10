import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../../shared/prisma.js";
import { AppError } from "../../shared/errors.js";
import { env } from "../../shared/env.js";

let s3: S3Client | null = null;

function getS3(): S3Client {
  if (!s3) {
    if (!env.STORAGE_ENDPOINT || !env.STORAGE_BUCKET || !env.STORAGE_ACCESS_KEY_ID || !env.STORAGE_SECRET_ACCESS_KEY) {
      throw new AppError(500, "Storage is not configured");
    }
    s3 = new S3Client({
      region: env.STORAGE_REGION,
      endpoint: env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }
  return s3;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
}

export async function generateUploadUrl(
  userId: string,
  contentType: string,
): Promise<UploadUrlResponse> {
  const extension = mapContentTypeToExtension(contentType);
  const objectKey = `avatars/${userId}/${randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: env.STORAGE_BUCKET,
    Key: objectKey,
    ContentType: contentType,
    ACL: "public-read",
  });

  const uploadUrl = await getSignedUrl(getS3(), command, {
    expiresIn: env.STORAGE_UPLOAD_URL_EXPIRY,
  });

  const publicUrl = env.STORAGE_PUBLIC_URL
    ? `${env.STORAGE_PUBLIC_URL.replace(/\/$/, "")}/${objectKey}`
    : uploadUrl.split("?")[0];

  return { uploadUrl, objectKey, publicUrl };
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function completeUpload(
  userId: string,
  objectKey: string,
): Promise<{ publicUrl: string }> {
  // 1. Verify the object key belongs to this user
  if (!objectKey.startsWith(`avatars/${userId}/`)) {
    throw new AppError(403, "Avatar key does not belong to the authenticated user");
  }

  // 2. Ensure the object exists by making a HEAD request
  let headResult;
  try {
    headResult = await getS3().send(
      new HeadObjectCommand({
        Bucket: env.STORAGE_BUCKET,
        Key: objectKey,
      }),
    );
  } catch {
    throw new AppError(404, "Uploaded file not found in storage. Upload may have failed.");
  }

  // 3. Validate content type
  const storedType = headResult.ContentType;
  if (!storedType || !ALLOWED_TYPES.includes(storedType as typeof ALLOWED_TYPES[number])) {
    throw new AppError(400, `Invalid file type: ${storedType ?? "unknown"}. Allowed: ${ALLOWED_TYPES.join(", ")}`);
  }

  // 4. Validate size
  const storedSize = headResult.ContentLength;
  if (storedSize === undefined || storedSize === 0) {
    throw new AppError(400, "Uploaded file is empty");
  }
  if (storedSize > MAX_SIZE_BYTES) {
    throw new AppError(400, `File too large (${(storedSize / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`);
  }

  // 5. Build the public URL
  const publicUrl = env.STORAGE_PUBLIC_URL
    ? `${env.STORAGE_PUBLIC_URL.replace(/\/$/, "")}/${objectKey}`
    : `${env.STORAGE_ENDPOINT!.replace(/\/$/, "")}/${env.STORAGE_BUCKET}/${objectKey}`;

  // 6. Update user's image field in the database
  await prisma.user.update({
    where: { id: userId },
    data: { image: publicUrl },
  });

  return { publicUrl };
}

function mapContentTypeToExtension(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      throw new AppError(400, `Unsupported content type: ${contentType}. Allowed: ${ALLOWED_TYPES.join(", ")}`);
  }
}
