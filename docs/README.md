# Auth Service Documentation

The Auth Service is a fully self-managed Authentication & Authorization microservice built with Node.js, TypeScript, Express, and PostgreSQL.

## How to run locally:
1. Ensure Docker Desktop is running.
2. Copy `.env.example` to `.env` and fill in any required variables.
3. Start the PostgreSQL database:
   ```bash
   docker-compose up -d
   ```
4. Install dependencies:
   ```bash
   pnpm install
   ```
5. Run the development server:
   ```bash
   pnpm dev
   ```
The service will start on `http://localhost:3001`.

## Endpoints:

### Auth
- **Health**: `GET /health` - Service status.
- **Register**: `POST /auth/register` - Create a new user & organization. Returns tokens.
- **Login**: `POST /auth/login` - Authenticate and get an access token and refresh token.
- **Refresh**: `POST /auth/refresh` - Refresh access tokens using a valid refresh token.

### Organizations
- **Get Org**: `GET /organizations/:id`
- **Update Org**: `PUT /organizations/:id`

### Projects
- **Create Project**: `POST /projects`
- **List Projects**: `GET /projects`
- **Get Project**: `GET /projects/:id`
- **Update Project**: `PUT /projects/:id`
- **Delete Project**: `DELETE /projects/:id`

### Project Members
- **Add Member**: `POST /project-members/:projectId/members`
- **Remove Member**: `DELETE /project-members/:projectId/members/:userId`
- **List Members**: `GET /project-members/:projectId/members`

### Users
- **Get Profile**: `GET /users/me`
- **Update Profile**: `PUT /users/me`
- **List Org Users**: `GET /users`
- **Update User Role**: `PATCH /users/:id/role`

*Note: All endpoints except `/health`, `/auth/register`, `/auth/login`, and `/auth/refresh` require an `Authorization: Bearer <token>` header.*
