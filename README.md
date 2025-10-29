# Letters Clone - Full Stack Blog Platform

A modern blog platform inspired by Substack, built with Next.js 14, Strapi 4, and PostgreSQL.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **State Management**: Zustand
- **API Client**: Apollo Client (GraphQL) + Fetch API (REST)

### Backend
- **CMS**: Strapi 4
- **Database**: PostgreSQL 15 (or SQLite for development)
- **API**: GraphQL + REST API
- **Authentication**: Strapi built-in

## Project Structure

```
letters-clone/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App router pages
│   │   ├── layout.tsx       # Root layout with Header/Footer
│   │   ├── page.tsx         # Home page
│   │   └── article/         # Article pages
│   ├── components/          # React components
│   │   ├── layout/          # Layout components (Header, Footer)
│   │   ├── article/         # Article components
│   │   ├── home/            # Home page components
│   │   └── ui/              # Shadcn UI components
│   ├── lib/                 # Utilities and configurations
│   │   ├── store.ts         # Zustand state management
│   │   ├── apollo-client.ts # Apollo GraphQL client
│   │   ├── api.ts           # REST API service layer
│   │   └── graphql/         # GraphQL queries and mutations
│   └── public/              # Static assets
│
└── backend/                 # Strapi backend application
    ├── config/              # Strapi configuration
    ├── src/
    │   ├── api/             # API endpoints
    │   │   ├── article/     # Article content type
    │   │   ├── author/      # Author content type
    │   │   ├── category/    # Category content type
    │   │   ├── comment/     # Comment content type
    │   │   └── newsletter/  # Newsletter content type
    │   └── components/      # Shared components
    │       └── shared/      # SEO component
    └── database/            # Database files (SQLite)
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL 15 (optional, SQLite works for development)

### Installation

1. **Clone the repository**
```bash
cd /home/ubuntu/letters-clone
```

2. **Install Frontend Dependencies**
```bash
cd frontend
pnpm install
```

3. **Install Backend Dependencies**
```bash
cd ../backend
pnpm install
```

### Development

#### Start Backend (Strapi)
```bash
cd backend
pnpm run develop
```

This will start Strapi on `http://localhost:1337`

**First time setup:**
1. Open `http://localhost:1337/admin`
2. Create an admin account
3. Configure API permissions:
   - Go to Settings → Users & Permissions Plugin → Roles → Public
   - Enable `find` and `findOne` for all content types
   - Enable GraphQL queries

#### Start Frontend (Next.js)
```bash
cd frontend
pnpm run dev
```

This will start Next.js on `http://localhost:3000`

## Content Types

### Article
- title (String, required)
- subtitle (String)
- slug (UID, required)
- content (Rich Text, required)
- excerpt (Text)
- featuredImage (Media)
- author (Relation to Author)
- category (Relation to Category)
- likes (Integer, default: 0)
- views (Integer, default: 0)
- readTime (Integer, default: 5)
- seo (Component)

### Author
- name (String, required)
- bio (Text)
- avatar (Media)
- email (Email)
- socialLinks (JSON)

### Category
- name (String, required, unique)
- slug (UID, required)
- description (Text)

### Comment
- content (Text, required)
- article (Relation to Article)
- author (String, required)
- authorAvatar (String)
- likes (Integer, default: 0)
- parentComment (Relation to Comment)

### Newsletter
- email (Email, required, unique)
- status (Enum: active, unsubscribed)

## Features

### Implemented
- ✅ Responsive dark theme design
- ✅ Article listing with pagination
- ✅ Article detail pages
- ✅ Category filtering
- ✅ Author profiles
- ✅ Newsletter subscription
- ✅ Like/comment counters
- ✅ SEO optimization
- ✅ GraphQL API
- ✅ REST API
- ✅ State management with Zustand

### To Be Implemented
- 🔲 Search functionality
- 🔲 Comment system
- 🔲 User authentication
- 🔲 Social sharing
- 🔲 Rich text editor for articles
- 🔲 Image upload and optimization
- 🔲 Email notifications
- 🔲 Analytics dashboard

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_STRAPI_API_URL`
   - `NEXT_PUBLIC_STRAPI_GRAPHQL_URL`
   - `NEXT_PUBLIC_STRAPI_URL`
4. Deploy

### Backend (Render)
1. Create PostgreSQL database on Render
2. Create Web Service for Strapi
3. Set environment variables:
   - `DATABASE_CLIENT=postgres`
   - `DATABASE_HOST`
   - `DATABASE_PORT`
   - `DATABASE_NAME`
   - `DATABASE_USERNAME`
   - `DATABASE_PASSWORD`
   - `NODE_ENV=production`
   - `APP_KEYS` (generate with `openssl rand -base64 32`)
   - `API_TOKEN_SALT` (generate with `openssl rand -base64 32`)
   - `ADMIN_JWT_SECRET` (generate with `openssl rand -base64 32`)
   - `JWT_SECRET` (generate with `openssl rand -base64 32`)
4. Deploy

## API Endpoints

### GraphQL
- Endpoint: `http://localhost:1337/graphql`
- Playground: `http://localhost:1337/graphql` (enabled in development)

### REST API
- Base URL: `http://localhost:1337/api`
- Articles: `/api/articles`
- Categories: `/api/categories`
- Authors: `/api/authors`
- Comments: `/api/comments`
- Newsletter: `/api/newsletters`

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **Database**: Strapi uses SQLite by default for development
3. **GraphQL Playground**: Access at `http://localhost:1337/graphql`
4. **Admin Panel**: Access at `http://localhost:1337/admin`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
