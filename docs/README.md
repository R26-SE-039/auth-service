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

## Database Connection Details

When running the database locally via Docker (`docker-compose up -d`), it exposes PostgreSQL on port `5433`.

You can connect to this database using any GUI tool (like DBeaver, DataGrip, or pgAdmin) or VS Code Extensions (like SQLTools) using these credentials:

- **Host**: `localhost`
- **Port**: `5433`
- **Database**: `user_db`
- **User**: `user`
- **Password**: `nextgen_db`

### Connection Strings

**Standard Connection URL** (used by Node.js/Prisma):
```
postgresql://user:nextgen_db@localhost:5433/user_db
```

**JDBC URL** (used by Java/Spring, DBeaver, DataGrip):
```
jdbc:postgresql://localhost:5433/user_db?user=user&password=nextgen_db
```

*To connect via command line directly inside the Docker container:*
```bash
docker exec -it user_db psql -U user -d user_db
```

## Endpoints:

### Auth
- **Health**: `GET /health` - Service status.
- **Register**: `POST /auth/register` - Create a new user & organization. Returns tokens.
- **Login**: `POST /auth/login` - Authenticate and get an access token and refresh token.
- **Refresh**: `POST /auth/refresh-token` - Refresh access tokens using a valid refresh token.
- **Logout**: `POST /auth/logout` - Revoke the current refresh token. *(Auth required)*
- **Accept Invite**: `POST /auth/accept-invite` - Accept an invitation and create your account in an existing organization.

### Organizations
- **Get Org**: `GET /organizations`
- **Update Org**: `PUT /organizations` *(ORGANIZATION_OWNER only)*
- **Send Invite**: `POST /organizations/invites` - Invite a user to join the organization by email. *(OWNER/ADMIN)*
- **List Invites**: `GET /organizations/invites` - View all pending invitations. *(OWNER/ADMIN)*
- **Revoke Invite**: `DELETE /organizations/invites/:id` - Cancel a pending invitation. *(OWNER/ADMIN)*

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

## Architecture & Data Flow

### Entity-Relationship (ER) Diagram
This diagram shows the PostgreSQL database schema managing multi-tenant organizations, users, and projects.

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "has"
    ORGANIZATIONS ||--o{ PROJECTS : "owns"
    ORGANIZATIONS ||--o{ ORGANIZATION_INVITES : "sends"
    USERS ||--|| USER_PROFILES : "has profile"
    USERS ||--o{ PROJECT_MEMBERS : "is member of"
    USERS ||--o{ REFRESH_TOKENS : "has"
    USERS ||--o{ ORGANIZATION_INVITES : "creates"
    PROJECTS ||--o{ PROJECT_MEMBERS : "includes"

    ORGANIZATIONS {
        uuid id PK
        varchar company_name
        varchar domain
        boolean is_active
    }
    
    USERS {
        uuid id PK
        uuid organization_id FK
        varchar email
        text password_hash
        varchar role "ORGANIZATION_OWNER, etc."
    }

    USER_PROFILES {
        uuid id PK
        uuid user_id FK
        varchar first_name
        varchar last_name
        varchar job_title
    }

    PROJECTS {
        uuid id PK
        uuid organization_id FK
        varchar name
        varchar status
    }

    PROJECT_MEMBERS {
        uuid project_id PK,FK
        uuid user_id PK,FK
        varchar project_role "PROJECT_OWNER, MEMBER"
    }

    REFRESH_TOKENS {
        varchar jti PK
        uuid user_id FK
        timestamp expires_at
        boolean revoked
    }

    ORGANIZATION_INVITES {
        uuid id PK
        uuid organization_id FK
        uuid invited_by_user_id FK
        varchar email
        varchar role
        varchar invite_token
        timestamp expires_at
        boolean accepted
    }
```

### Request Flow Sequence Diagram
This diagram illustrates the layered clean architecture used across the service, demonstrating how a secure request (like creating a project) flows through the layers.

```mermaid
sequenceDiagram
    actor Client
    participant Express Router as Routes
    participant Auth Middleware as Middleware
    participant Controller as Controllers
    participant Service as Services
    participant Repository as Repositories
    participant PostgreSQL as Database

    Client->>Express Router: POST /projects (Bearer Token)
    Express Router->>Auth Middleware: Validate Token & Roles
    
    alt Invalid Token or Unauthorized
        Auth Middleware-->>Client: 401/403 Error Response
    else Valid Token
        Auth Middleware->>Controller: Forward Request (with User info)
        Controller->>Service: createProject(userId, orgId, projectData)
        
        Service->>Database: BEGIN Transaction
        Service->>Repository: create(projectData)
        Repository->>Database: INSERT INTO projects...
        Database-->>Repository: Returned Project Entity
        Repository-->>Service: Project Entity
        
        Service->>Repository: addMember(projectId, userId, 'PROJECT_OWNER')
        Repository->>Database: INSERT INTO project_members...
        Database-->>Repository: Success
        Repository-->>Service: Success
        Service->>Database: COMMIT Transaction
        
        Service-->>Controller: Project & Member data
        Controller-->>Client: 201 Created (JSON)
    end
```
