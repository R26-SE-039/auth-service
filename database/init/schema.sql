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
-- Indexes
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Seed data  (development only — safe to remove in production)
-- Credentials: admin@acme.com / user@acme.com  →  password: password123
-- ---------------------------------------------------------------------------
INSERT INTO organizations (id, company_name, domain) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Acme Corp', 'acme.com');

INSERT INTO projects (id, organization_id, name, description, status) VALUES
    ('22222222-2222-2222-2222-222222222222',
     '11111111-1111-1111-1111-111111111111',
     'Website Redesign', 'Redesigning the main corporate website', 'active');

-- password_hash = bcrypt("password123", rounds=10)
INSERT INTO users (id, organization_id, email, password_hash, role) VALUES
    ('33333333-3333-3333-3333-333333333333',
     '11111111-1111-1111-1111-111111111111',
     'admin@acme.com',
     '$2b$10$EP/257368g0G5z1X/M211OWQnXYKk43q.5iPcdvHh2N0aZ5w5fQd6',
     'ORGANIZATION_OWNER'),
    ('44444444-4444-4444-4444-444444444444',
     '11111111-1111-1111-1111-111111111111',
     'user@acme.com',
     '$2b$10$EP/257368g0G5z1X/M211OWQnXYKk43q.5iPcdvHh2N0aZ5w5fQd6',
     'MEMBER');

INSERT INTO project_members (project_id, user_id, project_role) VALUES
    ('22222222-2222-2222-2222-222222222222',
     '33333333-3333-3333-3333-333333333333', 'PROJECT_OWNER'),
    ('22222222-2222-2222-2222-222222222222',
     '44444444-4444-4444-4444-444444444444', 'MEMBER');

INSERT INTO user_profiles (id, user_id, first_name, last_name, job_title) VALUES
    ('55555555-5555-5555-5555-555555555555',
     '33333333-3333-3333-3333-333333333333', 'Alice', 'Admin', 'Systems Administrator'),
    ('66666666-6666-6666-6666-666666666666',
     '44444444-4444-4444-4444-444444444444', 'Bob',   'User',  'Software Engineer');
