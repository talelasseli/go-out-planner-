# 03 — API Specification

Base URL:

```txt
/api
```

Authentication is handled by Better Auth. The exact auth route implementation can follow your Better Auth setup, but the app should expose simple auth actions to the frontend.

## Auth Endpoints

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Log in user | No |
| POST | `/api/auth/logout` | Log out user | Yes |

### Register

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "Ahmed Labidi",
  "username": "ahmed",
  "email": "ahmed@example.com",
  "password": "password123"
}
```

Success response:

```json
{
  "success": true,
  "message": "Registered successfully",
  "data": {
    "user": {
      "id": "user_123",
      "name": "Ahmed Labidi",
      "username": "ahmed",
      "email": "ahmed@example.com"
    }
  }
}
```

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "ahmed@example.com",
  "password": "password123"
}
```

Success response:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "user_123",
      "name": "Ahmed Labidi",
      "username": "ahmed",
      "email": "ahmed@example.com"
    }
  }
}
```

### Logout

```http
POST /api/auth/logout
```

Success response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## User Endpoints

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/api/users/me` | Get current user | Yes |
| GET | `/api/users/search?query=` | Search users | Yes |

### Get Current User

```http
GET /api/users/me
```

Success response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "Ahmed Labidi",
      "username": "ahmed",
      "email": "ahmed@example.com"
    }
  }
}
```

### Search Users

```http
GET /api/users/search?query=ali
```

Success response:

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_456",
        "name": "Ali Mansour",
        "username": "ali"
      }
    ]
  }
}
```

## Friend Endpoints

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/friend-requests` | Send friend request | Yes |
| GET | `/api/friend-requests/received` | Get received friend requests | Yes |
| PATCH | `/api/friend-requests/{requestId}/accept` | Accept friend request | Yes |
| PATCH | `/api/friend-requests/{requestId}/reject` | Reject friend request | Yes |
| GET | `/api/friends` | Get friends list | Yes |

### Send Friend Request

```http
POST /api/friend-requests
```

Request:

```json
{
  "receiverId": "user_456"
}
```

Success response:

```json
{
  "success": true,
  "message": "Friend request sent",
  "data": {
    "request": {
      "id": "request_123",
      "senderId": "user_123",
      "receiverId": "user_456",
      "status": "PENDING"
    }
  }
}
```

### Get Received Friend Requests

```http
GET /api/friend-requests/received
```

Success response:

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "request_123",
        "status": "PENDING",
        "sender": {
          "id": "user_456",
          "name": "Ali Mansour",
          "username": "ali"
        }
      }
    ]
  }
}
```

### Accept Friend Request

```http
PATCH /api/friend-requests/request_123/accept
```

Success response:

```json
{
  "success": true,
  "message": "Friend request accepted"
}
```

### Reject Friend Request

```http
PATCH /api/friend-requests/request_123/reject
```

Success response:

```json
{
  "success": true,
  "message": "Friend request rejected"
}
```

### Get Friends

```http
GET /api/friends
```

Success response:

```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "id": "user_456",
        "name": "Ali Mansour",
        "username": "ali"
      }
    ]
  }
}
```

## Plan Endpoints

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/plans` | Create plan | Yes |
| GET | `/api/plans/created` | Get plans created by current user | Yes |
| GET | `/api/plans/invited` | Get plans where current user is invited | Yes |
| GET | `/api/plans/{planId}` | Get plan details | Yes |

### Create Plan

```http
POST /api/plans
```

Request:

```json
{
  "title": "Go Out for Pizza",
  "date": "2026-06-10",
  "time": "19:30",
  "place": "City Center",
  "activities": ["Pizza", "Walk", "Coffee"],
  "invitedUserIds": ["user_456", "user_789"]
}
```

Success response:

```json
{
  "success": true,
  "message": "Plan created",
  "data": {
    "plan": {
      "id": "plan_123",
      "title": "Go Out for Pizza",
      "date": "2026-06-10",
      "time": "19:30",
      "place": "City Center",
      "activities": ["Pizza", "Walk", "Coffee"],
      "invitations": [
        {
          "id": "invitation_123",
          "invitedUserId": "user_456",
          "status": "PENDING"
        }
      ]
    }
  }
}
```

### Get Created Plans

```http
GET /api/plans/created
```

Success response:

```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "plan_123",
        "title": "Go Out for Pizza",
        "date": "2026-06-10",
        "time": "19:30",
        "place": "City Center"
      }
    ]
  }
}
```

### Get Invited Plans

```http
GET /api/plans/invited
```

Success response:

```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "plan_123",
        "title": "Go Out for Pizza",
        "date": "2026-06-10",
        "time": "19:30",
        "place": "City Center",
        "invitationStatus": "PENDING"
      }
    ]
  }
}
```

### Get Plan Details

```http
GET /api/plans/plan_123
```

Success response:

```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "plan_123",
      "title": "Go Out for Pizza",
      "date": "2026-06-10",
      "time": "19:30",
      "place": "City Center",
      "creator": {
        "id": "user_123",
        "name": "Ahmed Labidi",
        "username": "ahmed"
      },
      "activities": ["Pizza", "Walk", "Coffee"],
      "invitations": [
        {
          "id": "invitation_123",
          "status": "PENDING",
          "invitedUser": {
            "id": "user_456",
            "name": "Ali Mansour",
            "username": "ali"
          }
        }
      ]
    }
  }
}
```

## Invitation Endpoints

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/api/invitations` | Get current user's invitations | Yes |
| PATCH | `/api/invitations/{invitationId}/accept` | Accept invitation | Yes |
| PATCH | `/api/invitations/{invitationId}/decline` | Decline invitation | Yes |

### Get Invitations

```http
GET /api/invitations
```

Success response:

```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": "invitation_123",
        "status": "PENDING",
        "plan": {
          "id": "plan_123",
          "title": "Go Out for Pizza",
          "date": "2026-06-10",
          "time": "19:30",
          "place": "City Center"
        }
      }
    ]
  }
}
```

### Accept Invitation

```http
PATCH /api/invitations/invitation_123/accept
```

Success response:

```json
{
  "success": true,
  "message": "Invitation accepted"
}
```

### Decline Invitation

```http
PATCH /api/invitations/invitation_123/decline
```

Success response:

```json
{
  "success": true,
  "message": "Invitation declined"
}
```

## Common HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Not logged in |
| 403 | Not allowed |
| 404 | Resource not found |
| 409 | Duplicate or conflict |
| 500 | Server error |
