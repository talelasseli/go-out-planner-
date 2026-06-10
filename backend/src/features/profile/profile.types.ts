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
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileInput {
  name?: string;
  username?: string;
  displayUsername?: string;
  bio?: string;
  location?: { latitude: number; longitude: number };
}
