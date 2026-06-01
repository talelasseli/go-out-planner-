# Go Out Plan App Documentation

This folder contains simple planning documents for the **Go Out Plan** application.

The app lets users create an account, find friends, send friend requests, create plans, invite friends, and respond to invitations.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Auth | Better Auth |
| Database ORM | Prisma |
| Database | PostgreSQL |

## Documents

1. [`01-application-overview.md`](./01-application-overview.md) — simple explanation of the app and MVP scope.
2. [`02-requirements.md`](./02-requirements.md) — functional, non-functional, business, authorization, and validation rules.
3. [`03-api-spec.md`](./03-api-spec.md) — REST API endpoints, request examples, and response examples.
4. [`04-database-prisma.md`](./04-database-prisma.md) — database tables and example Prisma schema.
5. [`05-frontend-guide.md`](./05-frontend-guide.md) — React pages, components, state, and API usage.

## MVP Summary

The MVP should support:

- Register, login, logout.
- View current user profile.
- Search users.
- Send, accept, and reject friend requests.
- View friends list.
- Create a plan with title, date, time, place, activities, and invited friends.
- View plans created by the current user.
- View plans where the current user was invited.
- View plan details.
- View invitations.
- Accept or decline invitations.

every feature should be separated from the other


## Architecture Rule: Feature-Based Modules

The application should be built using a feature-based structure.

Each feature must be separated from the others as much as possible. 
A feature should contain its own routes, controllers, services, validation, types, and frontend pages/components.

The goal is that one feature can be removed later with minimal changes to the rest of the application.

Example features:

- auth
- users
- friends
- plans
- invitations

A feature should contain its own:

- routes
- controller
- service
- validation
- types

Shared code should be placed in a common/shared folder, not inside one feature.

Examples of shared code:

- database client
- auth middleware
- error handler
- API response helpers
- common types
- common UI components
