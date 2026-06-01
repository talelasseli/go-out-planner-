# 04 — Database and Prisma Design

## Database

Use **PostgreSQL** as the database.

Use **Prisma** as the ORM.

Use **Better Auth** for authentication tables and session management.

## Important Note About Users

Because the app uses Better Auth, do not build password handling manually.

Better Auth should handle:

- User authentication.
- Password hashing.
- Sessions.
- Login.
- Logout.

Your application tables should reference the authenticated user ID.

For simplicity, this document uses `String` IDs because auth libraries often use string IDs. If your Better Auth Prisma setup uses a different ID type, keep all related models consistent.

## Main Tables

| Table | Purpose |
|---|---|
| users | Authenticated users, managed or extended through Better Auth |
| friend_requests | Pending, accepted, or rejected friend requests |
| friendships | Accepted friend relationships |
| plans | Main plan information |
| plan_activities | Activities inside a plan |
| plan_invitations | Invited users and their responses |

## Relationship Summary

- One user can send many friend requests.
- One user can receive many friend requests.
- One user can have many friends.
- One user can create many plans.
- One plan can have many activities.
- One plan can have many invitations.
- One invitation belongs to one invited user.

## Example Prisma Schema

This is a simple starting point. Adjust it to match your Better Auth Prisma adapter setup.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum FriendRequestStatus {
  PENDING
  ACCEPTED
  REJECTED
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
  MAYBE
}

model User {
  id        String   @id
  name      String
  username  String?  @unique
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sentFriendRequests     FriendRequest[] @relation("SentFriendRequests")
  receivedFriendRequests FriendRequest[] @relation("ReceivedFriendRequests")

  friendships Friendship[] @relation("UserFriendships")
  friendOf    Friendship[] @relation("FriendOf")

  createdPlans Plan[]
  invitations  PlanInvitation[]

  @@map("users")
}

model FriendRequest {
  id          String              @id @default(cuid())
  senderId    String
  receiverId  String
  status      FriendRequestStatus @default(PENDING)
  createdAt   DateTime            @default(now())
  respondedAt DateTime?

  sender   User @relation("SentFriendRequests", fields: [senderId], references: [id], onDelete: Cascade)
  receiver User @relation("ReceivedFriendRequests", fields: [receiverId], references: [id], onDelete: Cascade)

  @@unique([senderId, receiverId])
  @@index([receiverId, status])
  @@map("friend_requests")
}

model Friendship {
  id        String   @id @default(cuid())
  userId    String
  friendId  String
  createdAt DateTime @default(now())

  user   User @relation("UserFriendships", fields: [userId], references: [id], onDelete: Cascade)
  friend User @relation("FriendOf", fields: [friendId], references: [id], onDelete: Cascade)

  @@unique([userId, friendId])
  @@index([friendId])
  @@map("friendships")
}

model Plan {
  id        String   @id @default(cuid())
  creatorId String
  title     String
  planDate  DateTime
  planTime  String
  place     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  creator     User             @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  activities  PlanActivity[]
  invitations PlanInvitation[]

  @@index([creatorId])
  @@map("plans")
}

model PlanActivity {
  id           String   @id @default(cuid())
  planId       String
  activityName String
  createdAt    DateTime @default(now())

  plan Plan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@index([planId])
  @@map("plan_activities")
}

model PlanInvitation {
  id            String           @id @default(cuid())
  planId        String
  invitedUserId String
  status        InvitationStatus @default(PENDING)
  createdAt     DateTime         @default(now())
  respondedAt   DateTime?

  plan        Plan @relation(fields: [planId], references: [id], onDelete: Cascade)
  invitedUser User @relation(fields: [invitedUserId], references: [id], onDelete: Cascade)

  @@unique([planId, invitedUserId])
  @@index([invitedUserId, status])
  @@map("plan_invitations")
}
```

## Friend Request Logic

When a user accepts a friend request:

1. Check the request exists.
2. Check the current user is the receiver.
3. Check the request is pending.
4. Update request status to accepted.
5. Create two friendship rows:
   - user A -> user B
   - user B -> user A

Use a transaction:

```ts
await prisma.$transaction(async (tx) => {
  await tx.friendRequest.update({
    where: { id: requestId },
    data: {
      status: "ACCEPTED",
      respondedAt: new Date(),
    },
  });

  await tx.friendship.createMany({
    data: [
      { userId: senderId, friendId: receiverId },
      { userId: receiverId, friendId: senderId },
    ],
    skipDuplicates: true,
  });
});
```

## Create Plan Logic

When creating a plan:

1. Authenticate user.
2. Validate request body.
3. Check date is not in the past.
4. Check activities are not empty.
5. Check invited users exist.
6. Check invited users are friends with creator.
7. Check no duplicate invited users.
8. Create plan.
9. Create plan activities.
10. Create plan invitations with status `PENDING`.
11. Commit transaction.

Example transaction:

```ts
await prisma.$transaction(async (tx) => {
  const plan = await tx.plan.create({
    data: {
      creatorId: currentUserId,
      title,
      planDate: new Date(date),
      planTime: time,
      place,
    },
  });

  await tx.planActivity.createMany({
    data: activities.map((activity) => ({
      planId: plan.id,
      activityName: activity,
    })),
  });

  await tx.planInvitation.createMany({
    data: invitedUserIds.map((userId) => ({
      planId: plan.id,
      invitedUserId: userId,
      status: "PENDING",
    })),
  });

  return plan;
});
```

## Database Constraints To Keep

| Constraint | Reason |
|---|---|
| Unique username | Prevent duplicate accounts |
| Unique email | Prevent duplicate login identity |
| Unique senderId + receiverId | Prevent duplicate friend request direction |
| Unique userId + friendId | Prevent duplicate friendships |
| Unique planId + invitedUserId | Prevent duplicate invitations |
| Index receiverId + status | Faster received friend request queries |
| Index invitedUserId + status | Faster invitation queries |
