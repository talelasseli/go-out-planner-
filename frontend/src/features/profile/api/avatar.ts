import { httpClient } from "@/lib/http";

export interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
}

export interface CompleteUploadResponse {
  publicUrl: string;
}

export function getAvatarUploadUrl(contentType: string) {
  return httpClient<UploadUrlResponse>("/api/avatar/upload-url", {
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

export function completeAvatarUpload(objectKey: string) {
  return httpClient<CompleteUploadResponse>("/api/avatar/complete", {
    method: "POST",
    body: JSON.stringify({ objectKey }),
  });
}
