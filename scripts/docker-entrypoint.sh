#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma

echo "Starting application..."
exec "$@"
