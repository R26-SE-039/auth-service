-- =============================================================================
-- NextGenQA — Auth Service · Full Database Schema
-- =============================================================================
-- Run order (Docker auto-runs all files in /docker-entrypoint-initdb.d/ on
-- first container start, sorted alphabetically):
--   001_schema.sql  →  this file (schema + seed)
--
-- Tables
--   organizations          - top-level tenants
--   projects               - projects scoped to an organization
--   users                  - platform users; belong to one organization
--   project_members        - many-to-many: users ↔ projects
--   user_profiles          - optional display info (name, avatar, title)
--   refresh_tokens         - JWT refresh token store (revocable)
--   organization_invites   - time-limited invite tokens for new members
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
CREATE TABLE organizations (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    domain       VARCHAR(255),
    is_active    BOOLEAN   DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    status          VARCHAR(50) DEFAULT 'active',
    created_at      TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            VARCHAR(50) NOT NULL
                        CHECK (role IN ('ORGANIZATION_OWNER','ORGANIZATION_ADMIN','PROJECT_OWNER','MEMBER')),
    is_active       BOOLEAN   DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- project_members  (junction table)
-- ---------------------------------------------------------------------------
CREATE TABLE project_members (
    project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES users(id)    ON DELETE CASCADE,
    project_role VARCHAR(100) NOT NULL
                     CHECK (project_role IN ('PROJECT_OWNER','MEMBER')),
    join_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

-- ---------------------------------------------------------------------------
-- user_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE user_profiles (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name  VARCHAR(100),
    job_title  VARCHAR(100),
    avatar_url TEXT
);

-- ---------------------------------------------------------------------------
-- refresh_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    jti        VARCHAR(255) PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    revoked    BOOLEAN   DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- organization_invites
-- Stores pending invitations for users to join an existing organization.
-- An ORGANIZATION_OWNER or ORGANIZATION_ADMIN generates a secure, time-limited
-- token. The invited user accepts via POST /auth/accept-invite with the token.
-- ---------------------------------------------------------------------------
CREATE TABLE organization_invites (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by_user_id  UUID NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    email               VARCHAR(255) NOT NULL,
    role                VARCHAR(50)  NOT NULL DEFAULT 'MEMBER'
                            CHECK (role IN ('ORGANIZATION_ADMIN','PROJECT_OWNER','MEMBER')),
    invite_token        VARCHAR(255) NOT NULL UNIQUE,
    expires_at          TIMESTAMP NOT NULL,
    accepted            BOOLEAN   DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- iterations
-- ---------------------------------------------------------------------------
CREATE TABLE iterations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    goal            TEXT,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PLANNING'
                        CHECK (status IN ('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_iteration_dates CHECK (end_date > start_date)
);

-- Enforce: only one ACTIVE iteration per project at any time
CREATE UNIQUE INDEX idx_one_active_per_project
    ON iterations(project_id)
    WHERE status = 'ACTIVE';


-- ---------------------------------------------------------------------------
-- project_configurations
-- ---------------------------------------------------------------------------
CREATE TABLE project_configurations (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id            UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    repo_url              TEXT NOT NULL,
    personal_access_token TEXT NOT NULL,
    jira_url              TEXT,
    jira_email            TEXT,
    jira_api_token        TEXT,
    jira_project_key      TEXT,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_project_configurations_project_id ON project_configurations(project_id);
CREATE INDEX idx_users_email                    ON users(email);
CREATE INDEX idx_users_organization_id          ON users(organization_id);
CREATE INDEX idx_projects_organization_id       ON projects(organization_id);
CREATE INDEX idx_project_members_user_id        ON project_members(user_id);
CREATE INDEX idx_project_members_project_id     ON project_members(project_id);
CREATE INDEX idx_refresh_tokens_user_id         ON refresh_tokens(user_id);
CREATE INDEX idx_org_invites_token              ON organization_invites(invite_token);
CREATE INDEX idx_org_invites_email              ON organization_invites(email);
CREATE INDEX idx_org_invites_org_id             ON organization_invites(organization_id);
CREATE INDEX idx_iterations_project_id          ON iterations(project_id);
CREATE INDEX idx_iterations_status              ON iterations(status);
CREATE INDEX idx_iterations_created_by          ON iterations(created_by);
