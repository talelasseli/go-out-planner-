# 02 — Requirements

## Functional Requirements

### Authentication

- Users can register.
- Users can log in.
- Users can log out.
- Users must be logged in before using friends, plans, or invitations.
- Authentication is handled by Better Auth.

### Users

- Users can view their own profile.
- Users can search other users by name, username, or email.
- The current user should not appear in their own search results.
- Usernames must be unique.
- Emails must be unique.

### Friend Requests

- A user can send a friend request to another user.
- A user cannot send a friend request to themselves.
- A user cannot send duplicate pending friend requests.
- A user cannot send a friend request to an existing friend.
- Only the receiver can accept or reject a friend request.
- Only pending friend requests can be accepted or rejected.
- Accepting a friend request creates a friendship in both directions.

### Friends

- A user can view their own friends list.
- A user cannot view another user's friends list.
- Friend list responses should not expose sensitive data.

### Plans

- A logged-in user can create a plan.
- A plan must have a title.
- A plan must have a date.
- A plan must have a time.
- A plan must have a place.
- A plan must have at least one activity.
- Plan date cannot be in the past.
- A plan can invite one or more friends.
- Only accepted friends can be invited.
- The creator cannot invite themselves.
- Duplicate invited users are not allowed.
- Only the creator and invited users can view plan details.

### Invitations

- Invitations start as pending.
- An invited user can accept or decline an invitation.
- Only the invited user can respond to their own invitation.
- Only pending invitations can be accepted or declined.
- Accepted invitations become accepted.
- Declined invitations become declined.

## Authorization Rules

### Users

- A user can only view their own account through `/api/users/me`.

### Friend Requests

- Only the receiver can accept or reject a friend request.

### Friends

- A user can only view their own friends list.

### Plans

- Only authenticated users can create plans.
- Only the creator can create invitations during plan creation.
- Only the creator and invited users can view plan details.

### Invitations

- Only the invited user can accept or decline their invitation.

## Validation Rules

### Register

| Field | Rule |
|---|---|
| name | Required, 2–100 characters |
| username | Required, 3–50 characters, unique |
| email | Required, valid email, unique |
| password | Required, minimum 8 characters |

### Search Users

| Field | Rule |
|---|---|
| query | Required, minimum 2 characters |

### Friend Request

| Field | Rule |
|---|---|
| receiverId | Required |
| receiverId | Must belong to an existing user |
| receiverId | Cannot be the current user |
| receiverId | Cannot already be a friend |
| receiverId | Cannot already have a pending request |

### Create Plan

| Field | Rule |
|---|---|
| title | Required, 3–150 characters |
| date | Required, valid date, not in the past |
| time | Required, valid time |
| place | Required, 2–255 characters |
| activities | Required, at least 1 activity |
| invitedUserIds | Required, at least 1 user |
| invitedUserIds | Users must exist |
| invitedUserIds | Users must be friends with creator |
| invitedUserIds | Cannot contain duplicates |
| invitedUserIds | Cannot contain creator ID |

### Invitation Response

| Field | Rule |
|---|---|
| invitationId | Required |
| invitationId | Must belong to an existing invitation |
| invitation status | Must be pending |
| current user | Must be the invited user |

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| MVP-NFR1 | Security |
| MVP-NFR2 | Authentication |
| MVP-NFR3 | Authorization |
| MVP-NFR4 | Simplicity |
| MVP-NFR5 | Mobile-friendly design |
| MVP-NFR6 | Basic performance |
| MVP-NFR7 | Data validation |
| MVP-NFR8 | No duplicates |

## Security Requirements

- Never return passwords in API responses.
- Let Better Auth handle passwords and sessions.
- Validate all request bodies.
- Protect private routes with authentication middleware.
- Check authorization in service functions.
- Use HTTPS in production.
- Store secrets in environment variables.
- Do not trust frontend validation only.

## Error Response Format

Use one simple error format for the whole API.

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```
