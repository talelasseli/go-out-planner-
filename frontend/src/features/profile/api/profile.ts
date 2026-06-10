import { httpClient } from "@/lib/http";

export interface ProfileResponse {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  username: string | null;
  displayUsername: string | null;
  bio: string | null;
  location: { latitude: number; longitude: number } | null;
  createdAt: string;
  updatedAt: string;
}

export type UpdateProfilePayload = {
  name?: string;
  username?: string;
  displayUsername?: string;
  bio?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
};

export function getProfile() {
  return httpClient<{ profile: ProfileResponse }>("/api/profile");
}

export function updateProfile(data: UpdateProfilePayload) {
  return httpClient<{ profile: ProfileResponse }>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  return httpClient<{ message: string }>("/api/profile/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function deleteAccount(password: string) {
  return httpClient<{ message: string }>("/api/profile", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}
