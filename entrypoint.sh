#!/bin/sh

# Exit on error
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z -v -w30 system_db-cu 3306
do
  echo "Waiting for database connection..."
  sleep 5
done

echo "Database is ready!"

# Check if .env exists, if not create it from environment variables
if [ ! -f .env ]; then
  echo "Creating .env file from environment variables..."
  cat > .env << EOF
DATABASE_URL=${DATABASE_URL}
NEXTAUTH_URL=${NEXTAUTH_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NODE_ENV=${NODE_ENV}
EOF
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma db push

# Create storage link if needed
echo "Creating storage link..."
mkdir -p public/uploads
ln -sf /app/uploads public/uploads 2>/dev/null || true

# Start the application
echo "Starting the application..."
exec "$@"