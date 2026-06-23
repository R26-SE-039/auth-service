import { query } from '../config/database';
import { UserRole } from '../core/types';

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  invited_by_user_id: string;
  email: string;
  role: UserRole;
  invite_token: string;
  expires_at: Date;
  accepted: boolean;
  created_at: Date;
}

export class InviteRepository {
  async create(
    organizationId: string,
    invitedByUserId: string,
    email: string,
    role: UserRole,
    inviteToken: string,
    expiresAt: Date
  ): Promise<OrganizationInvite> {
    const res = await query(
      `INSERT INTO organization_invites (organization_id, invited_by_user_id, email, role, invite_token, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [organizationId, invitedByUserId, email, role, inviteToken, expiresAt]
    );
    return res.rows[0];
  }

  async findByToken(token: string): Promise<OrganizationInvite | null> {
    const res = await query(
      'SELECT * FROM organization_invites WHERE invite_token = $1',
      [token]
    );
    return res.rows[0] || null;
  }

  async findPendingByEmail(email: string, organizationId: string): Promise<OrganizationInvite | null> {
    const res = await query(
      `SELECT * FROM organization_invites
       WHERE email = $1 AND organization_id = $2 AND accepted = FALSE AND expires_at > NOW()`,
      [email, organizationId]
    );
    return res.rows[0] || null;
  }

  async markAccepted(token: string): Promise<void> {
    await query(
      'UPDATE organization_invites SET accepted = TRUE WHERE invite_token = $1',
      [token]
    );
  }

  async listByOrganization(organizationId: string): Promise<OrganizationInvite[]> {
    const res = await query(
      `SELECT oi.*, u.email AS invited_by_email
       FROM organization_invites oi
       JOIN users u ON oi.invited_by_user_id = u.id
       WHERE oi.organization_id = $1
       ORDER BY oi.created_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  async deleteById(id: string, organizationId: string): Promise<boolean> {
    const res = await query(
      'DELETE FROM organization_invites WHERE id = $1 AND organization_id = $2',
      [id, organizationId]
    );
    return (res.rowCount ?? 0) > 0;
  }
}
