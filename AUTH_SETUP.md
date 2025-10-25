# Authentication Setup Guide

This project uses Auth.js (NextAuth v5) with Google OAuth and PostgreSQL for authentication.

## Prerequisites

1. A PostgreSQL database
2. Google OAuth credentials (Client ID and Client Secret)

## Setup Instructions

### 1. Database Setup

#### Option A: Local PostgreSQL
If you have PostgreSQL installed locally:
```bash
createdb game_nite
```

#### Option B: Cloud PostgreSQL
Use any PostgreSQL provider (e.g., Railway, Supabase, Neon, etc.)

### 2. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 credentials
5. Configure the OAuth consent screen
6. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Railway Configuration
RAILWAY_API_TOKEN=your_railway_api_token_here
RAILWAY_PROJECT_ID=your_railway_project_id
RAILWAY_ENVIRONMENT_ID=your_railway_environment_id

# Auth Configuration
AUTH_SECRET=your_auth_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Database Configuration (PostgreSQL for Auth.js)
DATABASE_URL=postgresql://user:password@localhost:5432/game_nite?schema=public
```

#### Generate AUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

### 4. Database Migration

Run Prisma migrations to create the necessary tables:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` and you'll be redirected to the login page.

## How Authentication Works

### Protected Routes
All routes are protected by default through the middleware (`middleware.ts`). Unauthenticated users are automatically redirected to `/login`.

### Protected Server Actions
All server actions in `actions/game-server.actions.ts` check for authentication before executing:
- `listServersAction`
- `createServerAction`
- `restartServerAction`
- `deleteServerAction`
- `getWorkflowStatusAction`

### User Menu
A user menu is displayed in the top-right corner of authenticated pages, showing:
- User's name or email
- Sign out button

### Login Page
The login page at `/login` matches the style of existing pages with:
- Gradient background
- Purple accent colors
- Google sign-in button

## Database Schema

The authentication system uses the following tables (managed by Prisma):
- `User` - User accounts
- `Account` - OAuth accounts linked to users
- `Session` - Active user sessions
- `VerificationToken` - Email verification tokens
- `Authenticator` - WebAuthn authenticators (optional)

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check network/firewall settings

### Google OAuth Issues
- Verify redirect URIs match exactly (including protocol)
- Check that OAuth consent screen is configured
- Ensure Google+ API is enabled

### Authentication Errors
- Verify `AUTH_SECRET` is set
- Check that all environment variables are loaded
- Clear browser cookies and try again

## Production Deployment

1. Set up a production PostgreSQL database
2. Configure production environment variables
3. Run database migrations in production:
   ```bash
   npx prisma migrate deploy
   ```
4. Update Google OAuth redirect URIs to include production domain
5. Ensure `AUTH_SECRET` is different from development

## Security Notes

- Never commit `.env` or `.env.local` files to version control
- Use different `AUTH_SECRET` values for different environments
- Regularly rotate OAuth credentials
- Use HTTPS in production
- Consider implementing rate limiting for authentication endpoints
