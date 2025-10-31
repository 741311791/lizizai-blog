# Backend Deployment Guide (Strapi)

This guide provides detailed instructions for deploying the Strapi backend. We recommend two primary methods: using **Render** for a managed platform experience or **Docker** for maximum flexibility.

## 1. Environment Variables

Before deploying, you need to prepare the following environment variables. Some require you to generate secure keys.

**Key Generation:**
Use `openssl` to generate secure random strings for the keys:
```sh
# Generate a 16-byte key (for APP_KEYS, use 4 of these)
openssl rand -base64 16

# Generate a 32-byte key (for other secrets)
openssl rand -base64 32
```

**Required Variables:**

| Variable | Description | Example / How to get it |
| --- | --- | --- |
| `NODE_ENV` | Sets the environment. | `production` |
| `HOST` | The host to bind the server to. | `0.0.0.0` |
| `PORT` | The port for the server to listen on. | `1337` (or as required by host) |
| `APP_KEYS` | Four comma-separated keys for cookie encryption. | `key1,key2,key3,key4` (Generate 4 keys) |
| `API_TOKEN_SALT` | Salt for API token generation. | Generate one `openssl rand -base64 32` |
| `ADMIN_JWT_SECRET` | Secret for the admin panel JWT. | Generate one `openssl rand -base64 32` |
| `JWT_SECRET` | Secret for the user-facing API JWT. | Generate one `openssl rand -base64 32` |
| `DATABASE_CLIENT` | The database client to use. | `postgres` or `sqlite` |
| `DATABASE_URL` | **Required for Render/Postgres.** Full connection string. | `postgres://user:pass@host:port/db` |
| `RESEND_API_KEY` | Your API key from [Resend](https://resend.com) for sending emails. | `re_xxxxxxxxxxxxxxxxx` |


## 2. Deployment on Render

Render provides a seamless deployment experience with auto-deploys from GitHub.

### Step 1: Create a PostgreSQL Database

1.  On the Render Dashboard, click **New +** > **PostgreSQL**.
2.  Provide a name, select a region, and choose your plan.
3.  Once created, go to the database's **Info** page and copy the **Internal Connection URL**. You will use this for the `DATABASE_URL` environment variable.

### Step 2: Create a Web Service

1.  On the Render Dashboard, click **New +** > **Web Service**.
2.  Connect your GitHub repository (`741311791/lizizai-blog`).
3.  Configure the service:
    -   **Name**: A unique name, e.g., `lizizai-blog-backend`.
    -   **Region**: Choose a region close to your users and database.
    -   **Branch**: `main`.
    -   **Root Directory**: `backend`.
    -   **Runtime**: `Node`.
    -   **Build Command**: `pnpm install && pnpm build`.
    -   **Start Command**: `pnpm start`.
    -   **Instance Type**: Choose a suitable plan (the Free plan is sufficient for development and testing).

### Step 3: Add Environment Variables

1.  Go to your new Web Service's **Environment** tab.
2.  Add all the environment variables listed in Section 1. Use the "Secret File" option for multi-line variables if needed.
    -   For `DATABASE_URL`, use the value you copied from your Render PostgreSQL database.
    -   For `RESEND_API_KEY`, get your key from the [Resend dashboard](https://resend.com/api-keys).

### Step 4: Deploy

1.  Click **Create Web Service**.
2.  Render will automatically start building and deploying your application. You can monitor the progress in the **Events** tab.
3.  Once deployed, your Strapi API will be available at the URL provided by Render (e.g., `https://your-service-name.onrender.com`).

## 3. Deployment with Docker

Using Docker is a great option for deploying to any cloud provider (AWS, GCP, Azure) or your own server.

### Step 1: Configure `docker-compose.yml`

The `docker-compose.yml` file in this directory is pre-configured for a production-like environment. You must, however, replace the placeholder secrets.

1.  Open `backend/docker-compose.yml`.
2.  **Crucially, replace all placeholder values** under the `environment` section:
    -   Update `DATABASE_*` variables to point to your production PostgreSQL database.
    -   Replace all placeholder keys (`APP_KEYS`, `API_TOKEN_SALT`, etc.) with securely generated secrets as described in Section 1. **Do not commit these secrets to version control.** Use a `.env` file or your deployment platform's secret management.

### Step 2: Build and Run the Container

From the `backend` directory, run the following commands:

```sh
# Build the Docker image
docker-compose build

# Start the service in detached mode
docker-compose up -d
```

Your Strapi backend will be running and accessible on port `1337` of the host machine.

## 4. Post-Deployment Setup

After your first deployment, you must configure the Strapi admin panel.

1.  Navigate to `https://your-backend-url/admin`.
2.  Create the first administrator account.
3.  Go to **Settings** > **Users & Permissions Plugin** > **Roles**.
4.  Select the **Public** role.
5.  Enable the `find` and `findOne` actions for `Article`, `Category`, `Author`, and `Tag` to make content publicly readable. Enable any other permissions required by your frontend.
6.  Enable the `subscribe` action for the `Subscriber` controller to allow new user subscriptions.
7.  Click **Save**.
