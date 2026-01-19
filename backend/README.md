# Backend API Documentation

Express.js backend with TypeScript, providing RESTful API with security, validation, and OpenAPI documentation.

## 📋 Overview

**Tech Stack:**

- 🔒 **Security**: Helmet.js, CORS, Rate Limiting
- 📝 **Validation**: Zod schema validation with OpenAPI integration
- 📊 **Documentation**: Auto-generated Swagger/OpenAPI
- 🏗️ **Architecture**: Layered (Router → Controller → Service → Repository)
- 🗄️ **Database**: PostgreSQL with Prisma ORM
- 🧪 **Testing**: Vitest framework
- 📦 **Type Safety**: Full TypeScript with strict mode
- 🚀 **Production Ready**: Docker support, error handling, logging

## 📁 Project Structure

```
backend/
├── src/
│   ├── api/                    # API modules (domain-based)
│   │   ├── healthCheck/        # Health check endpoint
│   │   └── user/               # User module
│   │       ├── __tests__/      # Unit tests
│   │       ├── userController.ts   # Request handlers
│   │       ├── userModel.ts        # Zod schemas & types
│   │       ├── userRepository.ts   # Data access layer
│   │       ├── userRouter.ts       # Route definitions
│   │       └── userService.ts      # Business logic
│   │
│   ├── api-docs/               # OpenAPI/Swagger documentation
│   │   ├── openAPIDocumentGenerator.ts
│   │   ├── openAPIResponseBuilders.ts
│   │   └── openAPIRouter.ts
│   │
│   ├── common/                 # Shared utilities
│   │   ├── db/                 # Database clients
│   │   │   └── postgres/      # Prisma client
│   │   ├── middleware/        # Express middlewares
│   │   │   ├── errorHandler.ts    # Global error handler
│   │   │   ├── rateLimiter.ts     # Rate limiting
│   │   │   └── requestLogger.ts   # Request logging (Pino)
│   │   ├── models/            # Shared data models
│   │   │   └── serviceResponse.ts  # Standard API response
│   │   └── utils/             # Utility functions
│   │       ├── commonValidation.ts  # Common Zod validations
│   │       ├── envConfig.ts         # Environment config (Envalid)
│   │       ├── httpHandlers.ts      # HTTP response helpers
│   │       └── zodExtension.ts     # Zod OpenAPI extension
│   │
│   └── index.ts               # Application entry point
│
├── prisma/                    # Prisma schema & migrations
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data script
│   └── migrations/            # Migration files
│
├── dist/                      # Compiled JavaScript (generated)
├── .env.example               # Environment variables template
├── Dockerfile                 # Docker configuration
├── package.json
├── tsconfig.json              # TypeScript configuration
└── vite.config.mts           # Build configuration (TSUP)
```

## 🏗️ Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│         Router Layer                │
│  (Request validation, OpenAPI docs) │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Controller Layer             │
│    (HTTP request/response handling) │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Service Layer               │
│      (Business logic)               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Repository Layer             │
│    (Data access, Prisma queries)    │
└─────────────────────────────────────┘
```

### Request Flow

1. **Request** → Express Router
2. **Middleware** → Rate limiting, CORS, Helmet, Logging
3. **Router** → Route handler with Zod validation
4. **Controller** → Process request, call service
5. **Service** → Business logic
6. **Repository** → Data access (Prisma)
7. **Response** → ServiceResponse → HTTP response

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 22.11.0
- **Yarn**: Package manager
- **PostgreSQL**: Database server
- **TypeScript**: ^5.9.3

### Installation

```bash
# Install dependencies
yarn install

# Setup database (creates tables and seeds data)
yarn db:init
```

### Environment Configuration

Create `.env` file from `.env.example`:

```env
NODE_ENV=development
HOST=localhost
PORT=3000
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=public

# Rate Limiting
COMMON_RATE_LIMIT_MAX_REQUESTS=1000
COMMON_RATE_LIMIT_WINDOW_MS=60000
```

### Development

```bash
# Run development server with hot reload
yarn dev

# Server runs at http://localhost:3000
```

### Production Build

```bash
# Build TypeScript to JavaScript
yarn build

# Start production server
yarn start
```

### Database Commands

```bash
# Initialize database (first time)
yarn db:init

# Create migration after schema changes
yarn db:migrate

# Deploy migrations (production)
yarn db:migrate:deploy

# Reset database (development only)
yarn db:reset

# Seed data
yarn db:seed

# Open Prisma Studio (database GUI)
yarn db:studio
```

**📖 See [prisma/README.md](./prisma/README.md) for detailed database migration guide.**

### Testing

```bash
# Run tests
yarn test

# Run tests with coverage
yarn test -- --coverage
```

### Code Quality

```bash
# Lint code
yarn lint

# Fix linting errors
yarn lint:fix
```

## 📡 API Endpoints

### Base URL

- **Development**: `http://localhost:3000`
- **Production**: (configure via environment)

### Health Check

```
GET /health-check
```

**Response:**

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": null,
  "statusCode": 200
}
```

### API Documentation

Swagger UI available at:

- **Swagger UI**: `http://localhost:3000/`
- **OpenAPI JSON**: `http://localhost:3000/swagger.json`

## 🔧 Configuration

### Environment Variables

| Variable                         | Description                               | Default               | Required |
| -------------------------------- | ----------------------------------------- | --------------------- | -------- |
| `NODE_ENV`                       | Environment (development/production/test) | `development`         | No       |
| `HOST`                           | Server host                               | `localhost`           | No       |
| `PORT`                           | Server port                               | `3000`                | No       |
| `CORS_ORIGIN`                    | CORS allowed origin                       | `*`                   | No       |
| `DATABASE_URL`                   | PostgreSQL connection string              | (see default in code) | No       |
| `COMMON_RATE_LIMIT_MAX_REQUESTS` | Max requests per window                   | `1000`                | No       |
| `COMMON_RATE_LIMIT_WINDOW_MS`    | Rate limit window (ms)                    | `60000` (1 minute)    | No       |

### Path Aliases

Project uses path aliases for easier imports:

```typescript
// Instead of
import { userService } from "../../../api/user/userService";

// Use
import { userService } from "@/api/user/userService";
```

Configured in `tsconfig.json`:

- `@/*` → `src/*`

## 🛡️ Security Features

### 1. Helmet.js

- Sets security HTTP headers
- Prevents XSS, clickjacking, etc.

### 2. CORS

- Configures cross-origin requests
- Only allows specified origin

### 3. Rate Limiting

- Limits requests per IP
- Uses `ipKeyGenerator` for IPv6 support
- Configurable via environment variables

### 4. Input Validation

- All inputs validated with Zod schemas
- Automatic validation error handling

## 📝 Code Patterns

### Service Response Pattern

All API responses use `ServiceResponse` class:

```typescript
// Success response
const response = ServiceResponse.success("Data retrieved", data, StatusCodes.OK);

// Failure response
const response = ServiceResponse.failure("Error message", null, StatusCodes.BAD_REQUEST);
```

### Request Validation

Use Zod schemas with `validateRequest` middleware:

```typescript
// Define schema
const GetUserSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

// Use in router
userRouter.get("/:id", validateRequest(GetUserSchema), userController.getUser);
```

### OpenAPI Documentation

Auto-generate OpenAPI docs from Zod schemas:

```typescript
userRegistry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["User"],
  request: {
    params: z.object({
      id: z.string().describe("User ID"),
    }),
  },
  responses: createApiResponse(UserSchema, "Success"),
});
```

## 🐳 Docker

### Build Image

```bash
docker build -t backend-api .
```

### Run Container

```bash
docker run -p 8081:8081 \
  -e NODE_ENV=production \
  -e PORT=8081 \
  -e CORS_ORIGIN=http://localhost:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  backend-api
```

### Dockerfile

- Base image: `node:22.11.0-slim`
- Build command: `yarn build`
- Exposed port: `8081`
- Start command: `yarn start`

## 📚 Tech Stack

- **Runtime**: Node.js 22.11.0
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.9.3
- **Database**: PostgreSQL with Prisma 6.1.0
- **Validation**: Zod 4.1.12
- **API Docs**: @asteasolutions/zod-to-openapi 8.1.0
- **Security**: Helmet 8.1.0
- **Rate Limiting**: express-rate-limit 8.2.1
- **Logging**: Pino 10.1.0
- **Testing**: Vitest 4.0.6
- **Build**: TSUP 8.5.0

## 🎯 Quick Reference

```bash
# Development
yarn dev

# Build
yarn build
yarn start

# Database
yarn db:init          # First-time setup
yarn db:migrate       # Create migration
yarn db:migrate:deploy # Deploy (production)
yarn db:seed          # Seed data
yarn db:studio        # Database GUI

# Testing
yarn test

# Code Quality
yarn lint
yarn lint:fix
```

## 📄 License

MIT

## 👤 Author

Phong Nguyen
