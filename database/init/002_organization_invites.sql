-- Organization Invites Table
-- Stores pending invitations for users to join an existing organization.
-- An ORGANIZATION_OWNER or ORGANIZATION_ADMIN generates a secure, time-limited token.
-- The invited user accepts the invite via POST /auth/accept-invite with the token + their password.

CREATE TABLE organization_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ORGANIZATION_ADMIN', 'PROJECT_OWNER', 'MEMBER')),
    invite_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organization_invites_token ON organization_invites(invite_token);
CREATE INDEX idx_organization_invites_email ON organization_invites(email);
CREATE INDEX idx_organization_invites_org_id ON organization_invites(organization_id);
