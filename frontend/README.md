# Frontend Deployment Guide (Next.js)

This guide provides detailed instructions for deploying the Next.js frontend. The recommended and most efficient method is using **Vercel**, the platform built by the creators of Next.js.

## 1. Environment Variables

Before deploying, you need to configure the following environment variables to connect the frontend with your deployed Strapi backend.

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_STRAPI_URL` | The base URL of your live Strapi backend. | `https://your-strapi-backend.onrender.com` |

*Note: While other `STRAPI` variables might be present in configuration files, setting `NEXT_PUBLIC_STRAPI_URL` is the most critical, as other paths are derived from it in the API client (`/lib/strapi.ts`).*

## 2. Deployment on Vercel (Web UI)

Deploying through the Vercel dashboard is the simplest method and provides benefits like automatic CI/CD.

### Step 1: Import Project

1.  Log in to your [Vercel account](https://vercel.com/dashboard).
2.  Click **Add New...** > **Project**.
3.  Select your Git provider and import the `741311791/lizizai-blog` repository.

### Step 2: Configure Project

1.  Vercel will automatically detect that you are using Next.js.
2.  Expand the **Root Directory** section and set it to `frontend`.
3.  Vercel will automatically configure the correct build and output settings based on the `vercel.json` file in the root of the repository.

### Step 3: Add Environment Variables

1.  Go to the **Environment Variables** section.
2.  Add `NEXT_PUBLIC_STRAPI_URL` and set its value to the URL of your deployed Strapi backend.

### Step 4: Deploy

1.  Click **Deploy**.
2.  Vercel will build and deploy your frontend application.
3.  Once complete, you will get a public URL for your live site.

Any subsequent pushes to your `main` branch will automatically trigger a new deployment.

## 3. Deployment on Vercel (CLI)

For those who prefer working from the command line, the Vercel CLI offers a powerful alternative.

### Step 1: Install Vercel CLI

If you don't have it installed, run:
```sh
pnpm install -g vercel
```

### Step 2: Log In

Log in to your Vercel account:
```sh
vercel login
```

### Step 3: Link the Project

Navigate to the `frontend` directory and link your local project to the Vercel project.

```sh
cd /path/to/lizizai-blog/frontend
vercel link
```

Vercel will guide you through creating a new project or linking to an existing one. It will automatically detect the settings from the `vercel.json` in the parent directory.

### Step 4: Set Environment Variables

Add your Strapi backend URL as a secret and expose it as an environment variable.

```sh
# Add the secret
vercel secrets add strapi-url https://your-strapi-backend.onrender.com

# Add the environment variable to your project for production
vercel env add NEXT_PUBLIC_STRAPI_URL @strapi-url production
```

### Step 5: Deploy

Deploy to a preview environment first to test:
```sh
vercel
```

Once you are ready, deploy to production:
```sh
vercel --prod
```

This command will build and deploy your project, and you will receive the live URL upon completion.
