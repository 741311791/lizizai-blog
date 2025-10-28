# Blog Monorepo

A bilingual (English/Chinese) blog application built with Next.js and Strapi.

## Project Structure

```
.
├── frontend/          # Next.js frontend application
│   ├── src/          # Source code
│   ├── tests/        # Playwright E2E tests
│   └── playwright.config.ts
├── cms/              # Strapi CMS backend
│   ├── tests/        # Smoke tests
│   └── config/       # Strapi configuration
└── .github/workflows/ # CI/CD workflows
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Strapi 4 with GraphQL
- **Testing**: Playwright (E2E), Jest (Unit/Integration)
- **Package Manager**: pnpm 8
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 18.x or 20.x
- pnpm 8.15.0 or higher

## Getting Started

### Installation

```bash
# Install dependencies for all workspaces
pnpm install
```

### Development

```bash
# Start all services in parallel
pnpm dev

# Start frontend only
pnpm --filter frontend dev

# Start CMS only
pnpm --filter cms develop
```

The frontend will be available at `http://localhost:3000` and Strapi at `http://localhost:1337`.

### Building

```bash
# Build all workspaces
pnpm build

# Build frontend only
pnpm --filter frontend build

# Build CMS only
pnpm --filter cms build
```

## Testing

This project includes comprehensive testing setup with Playwright for frontend E2E tests and Jest for CMS smoke tests.

### Frontend E2E Tests (Playwright)

The frontend uses Playwright to test user interactions across different locales (English and Chinese).

```bash
# Run all E2E tests (headless)
pnpm --filter frontend test:e2e

# Run E2E tests with UI
pnpm --filter frontend test:e2e:ui

# Run E2E tests in headed mode
pnpm --filter frontend test:e2e:headed
```

**Test Coverage:**
- Home page navigation and hero section
- Blog listing page with mocked Strapi API
- CTA button interactions
- Internationalization (en/zh routes)

**Configuration:**
- Config file: `frontend/playwright.config.ts`
- Tests directory: `frontend/tests/`
- Base URL: Configurable via `BASE_URL` environment variable (defaults to `http://localhost:3000`)

### CMS Smoke Tests (Jest)

The CMS includes smoke tests to verify that Strapi is running correctly and essential endpoints are accessible.

```bash
# Run CMS smoke tests
pnpm --filter cms test
```

**Test Coverage:**
- Health check endpoint
- API endpoints availability
- GraphQL endpoint and schema introspection
- Content types registration

**Configuration:**
- Config file: `cms/jest.config.js`
- Tests directory: `cms/tests/`
- Strapi URL: Configurable via `STRAPI_URL` environment variable (defaults to `http://localhost:1337`)

### Running All Tests

```bash
# Run tests for all workspaces
pnpm test
```

### CI/CD

Tests are automatically run on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

The CI workflow (`.github/workflows/test.yml`) includes:
- Frontend E2E tests with Playwright (headless Chrome)
- CMS smoke tests with a temporary Strapi instance
- Automatic artifact uploads for test reports and logs

## Environment Variables

### Frontend

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
BASE_URL=http://localhost:3000
```

### CMS

Copy `.env.example` to `.env` in the `cms` directory and configure:

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys
API_TOKEN_SALT=your-token-salt
ADMIN_JWT_SECRET=your-admin-secret
TRANSFER_TOKEN_SALT=your-transfer-salt
JWT_SECRET=your-jwt-secret
```

## Internationalization

The application supports two locales:
- English (`en`) - Default
- Chinese (`zh`)

Routes are automatically prefixed with the locale (e.g., `/en/blog`, `/zh/blog`).

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass locally
4. Submit a pull request

## License

MIT
