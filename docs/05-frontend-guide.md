# 05 — React Frontend Guide

## Frontend Stack

Use:

- React
- TypeScript
- React Router
- Fetch or Axios for API calls
- Optional: TanStack Query for server state
shadcn Tailwind CSS for styling

Keep the first version simple.

## Main Pages

| Page | Route | Purpose |
|---|---|---|
| Sign Up | `/register` | Create account |
| Login | `/login` | Log in |
| Dashboard | `/dashboard` | Main page after login |
| Friends | `/friends` | Search users, send friend requests, view friends |
| Friend Requests | `/friend-requests` | Accept or reject received requests |
| Create Plan | `/plans/create` | Create a plan and invite friends |
| My Plans | `/plans/created` | View plans created by current user |
| Invited Plans | `/plans/invited` | View plans where current user is invited |
| Plan Details | `/plans/:planId` | View plan details |
| Invitations | `/invitations` | Accept or decline invitations |

## Suggested Folder Structure

```txt
frontend/src/
  api/
    auth.api.ts
    users.api.ts
    friends.api.ts
    plans.api.ts
    invitations.api.ts
    http.ts

  auth/
    AuthProvider.tsx
    ProtectedRoute.tsx

  components/
    Button.tsx
    Input.tsx
    ErrorMessage.tsx
    Loading.tsx
    PlanCard.tsx
    UserCard.tsx
    FriendRequestCard.tsx
    InvitationCard.tsx

  pages/
    LoginPage.tsx
    RegisterPage.tsx
    DashboardPage.tsx
    FriendsPage.tsx
    FriendRequestsPage.tsx
    CreatePlanPage.tsx
    CreatedPlansPage.tsx
    InvitedPlansPage.tsx
    PlanDetailsPage.tsx
    InvitationsPage.tsx

  routes/
    AppRoutes.tsx

  types/
    auth.types.ts
    user.types.ts
    friend.types.ts
    plan.types.ts
    invitation.types.ts

  hooks/
    useCurrentUser.ts
    useFriends.ts
    usePlans.ts
```

## API Client

Create one HTTP helper file.

```ts
// src/api/http.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
```

## Auth Flow

```txt
1. User registers or logs in.
2. Backend creates Better Auth session.
3. Frontend calls /api/users/me.
4. If user exists, show protected pages.
5. If user is not logged in, redirect to /login.
```

## Protected Route Example

```tsx
// src/auth/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
```

## Main UI Components

### UserCard

Used in user search results.

Displays:

- Name.
- Username.
- Send friend request button.

### FriendRequestCard

Used in received friend requests.

Displays:

- Sender name.
- Accept button.
- Reject button.

### PlanCard

Used in created and invited plans.

Displays:

- Title.
- Date.
- Time.
- Place.
- Status if invited.

### InvitationCard

Used in invitations page.

Displays:

- Plan title.
- Date.
- Time.
- Place.
- Accept button.
- Decline button.

## Create Plan Page

The create plan form should include:

- Title input.
- Date input.
- Time input.
- Place input.
- Activities list.
- Add activity button.
- Friends multi-select.
- Create plan button.

Example form state:

```ts
type CreatePlanForm = {
  title: string;
  date: string;
  time: string;
  place: string;
  activities: string[];
  invitedUserIds: string[];
};
```

## Frontend Validation

Frontend validation improves user experience, but backend validation is still required.

Validate these before submit:

- Title is not empty.
- Date is not in the past.
- Time is not empty.
- Place is not empty.
- At least one activity exists.
- At least one friend is selected.

## Dashboard Layout

Simple dashboard cards:

```txt
Dashboard
  - Friends
  - Friend Requests
  - Create Plan
  - My Plans
  - Invited Plans
  - Invitations
```

## Mobile-Friendly Design

Keep the UI easy to use on mobile:

- Use single-column layout on small screens.
- Use large buttons.
- Keep forms short.
- Use clear error messages.
- Avoid too many actions on one screen.


