export interface Profile {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  respondedAt: string | null;
  sender?: Pick<Profile, "id" | "username" | "displayName">;
  receiver?: Pick<Profile, "id" | "username" | "displayName">;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
  friend: Pick<Profile, "id" | "username" | "displayName">;
}

export interface PlanActivity {
  id: string;
  planId: string;
  activityName: string;
}

export interface PlanInvitation {
  id: string;
  planId: string;
  invitedUserId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  respondedAt: string | null;
  invitee?: Pick<Profile, "id" | "username" | "displayName" | "userId">;
}

export interface Plan {
  id: string;
  creatorId: string;
  title: string;
  planDate: string;
  planTime: string;
  place: string;
  latitude: number | null;
  longitude: number | null;
  meetupPlace: string | null;
  status: "ACTIVE" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  creator?: Pick<Profile, "id" | "username" | "displayName">;
  activities: PlanActivity[];
  invitations: PlanInvitation[];
}

export interface Invitation {
  id: string;
  planId: string;
  invitedUserId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  respondedAt: string | null;
  plan: Plan & { creator: Pick<Profile, "id" | "username" | "displayName"> };
}

export interface CreatePlanInput {
  title: string;
  planDate: string;
  planTime: string;
  place: string;
  latitude?: number;
  longitude?: number;
  meetupPlace?: string;
  activities: string[];
  invitedFriendIds: string[];
}

export interface EditPlanInput {
  title?: string;
  planDate?: string;
  planTime?: string;
  place?: string;
  latitude?: number;
  longitude?: number;
  meetupPlace?: string;
  activities?: string[];
  invitedFriendIds?: string[];
}
