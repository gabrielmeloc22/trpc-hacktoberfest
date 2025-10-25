# Chirp - Twitter Clone

A Twitter-like social media application built with Next.js, tRPC, Prisma, and PostgreSQL.

## Features

- User authentication with Clerk
- Create, read, and delete posts
- Like posts
- Reply to posts
- User profiles
- Infinite scroll pagination

## Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL database
- Clerk account for authentication

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file:

```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `CLERK_SECRET_KEY`: Your Clerk secret key

5. Run database migrations:

```bash
npm run migrate-dev
```

6. Seed the database (optional):

```bash
npm run db-seed
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with database migrations and seeding
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run prisma-studio` - Open Prisma Studio database viewer
- `npm run db-reset` - Reset database and re-run migrations
- `npm test` - Run integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:db:up` - Start test database container
- `npm run test:db:down` - Stop test database container

## Testing

This project includes comprehensive integration tests for all tRPC backend routes.

### Running Tests

To run the full test suite:

```bash
npm test
```

This will:

1. Start the test database Docker container (PostgreSQL on port 5433)
2. Run database migrations
3. Execute all tests
4. Clean up test data between test suites

To run tests in watch mode during development:

```bash
npm run test:watch
```

### Test Database

Tests use a separate PostgreSQL database running in Docker to avoid conflicts with your development database. The test database configuration is in:

- `docker-compose.test.yml` - Test database Docker configuration
- `.env.test` - Test database environment variables

The test database runs on port 5433 (dev database uses 5432).

### Test Coverage

Integration tests cover:

- **Post Router**: Creating, listing, filtering, pagination, and deletion
- **User Router**: User synchronization
- **Like Router**: Toggling likes and fetching like status
- **Reply Router**: Creating, listing, and deleting replies

All tests run against the real database with proper authentication simulation.

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: tRPC, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Clerk
- **Testing**: Vitest

test
