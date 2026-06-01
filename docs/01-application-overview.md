# 01 — Application Overview

## App Name

**Go Out Plan App**

## Purpose

The app helps users organize simple social plans with friends.

A user can:

- Create an account.
- Log in.
- Search for other users.
- Send friend requests.
- Accept or reject friend requests.
- Create a plan.
- Add activities to the plan.
- Invite friends to the plan.
- Accept or decline invitations.
- View created and invited plans.

## Main User Types

### Guest

A guest is a user who is not logged in.

Guest actions:

- Sign up.
- Log in.

### Registered User

A registered user is logged in.

Registered user actions:

- Edit profile later if needed.
- Search users.
- Send friend requests.
- Accept friend requests.
- Reject friend requests.
- View friends list.
- Create a go out plan.
- View own plans.
- View invitations.

### Plan Creator

A plan creator is the user who creates a plan.

Plan creator actions:

- Create a plan.
- Invite friends during plan creation.
- View invitation responses.
- Edit or cancel plans later if needed.

### Invited Friend

An invited friend is a user invited to a plan.

Invited friend actions:

- View plan invitation.
- Accept invitation.
- Decline invitation.
- View plan details.

## MVP Scope

The first version should focus only on the most important features.

### Included in MVP

- Authentication.
- User search.
- Friend requests.
- Friends list.
- Create plan.
- Invite friends to a plan.
- View plans.
- View invitations.
- Accept or decline invitations.

### Not Required in MVP

These can be added later:

- Remove friend.
- Edit plan.
- Cancel plan.
- Delete plan.
- Notifications.
- Mark invitation as maybe.
- Chat inside a plan.
- Map integration.
- Push notifications.

## User Journey

```txt
1. User opens app.
2. User signs up or logs in.
3. User goes to home dashboard.
4. User searches for friends.
5. User sends friend requests.
6. Friend accepts request.
7. User creates a plan.
8. User selects date, time, place, activities, and friends.
9. App creates the plan and sends invitations.
10. Invited friends accept or decline.
11. Creator views responses.
```

## Main Screens

| Screen | Purpose |
|---|---|
| Sign Up | Create a new account |
| Login | Log in to existing account |
| Dashboard | Main home screen after login |
| Friends | Search users, send requests, view friends |
| Friend Requests | Accept or reject received requests |
| Create Plan | Add plan details and invite friends |
| My Plans | View plans created by the user |
| Invited Plans | View plans where the user was invited |
| Plan Details | View plan information and invitation status |
| Invitations | Accept or decline invitations |

## Simple Success Criteria

The app is successful when a user can complete this full flow:

```txt
Register -> Login -> Add friend -> Create plan -> Invite friend -> Friend accepts invitation
```
