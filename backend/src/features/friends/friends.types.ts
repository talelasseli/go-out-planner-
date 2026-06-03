export type RelationshipStatus =
  | "FRIENDS"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED"
  | "NONE";

export type UserWithRelationship = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  relationship: RelationshipStatus;
  pendingRequestId: string | null;
};

export type RequestShape = {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
};

export type SendRequestResult =
  | { kind: "created"; request: RequestShape }
  | { kind: "resent"; request: RequestShape }
  | { kind: "already_sent" }
  | { kind: "auto_accepted" };
