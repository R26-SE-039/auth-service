import { query } from '../config/database';
import { UserRole } from '../core/types';

export interface User {
  id: string;
  organization_id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  avatar_url: string | null;
}

export class UserRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  }

  async findUserById(id: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findProfileByUserId(userId: string): Promise<UserProfile | null> {
    const res = await query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  }

  async findOrganizationByName(companyName: string, client?: any): Promise<any | null> {
    const q = client ? client.query.bind(client) : query;
    const res = await q('SELECT * FROM organizations WHERE company_name = $1', [companyName]);
    return res.rows[0] || null;
  }

  async createOrganization(companyName: string, client?: any) {
    const q = client ? client.query.bind(client) : query;
    const res = await q(
      'INSERT INTO organizations (company_name) VALUES ($1) RETURNING *',
      [companyName]
    );
    return res.rows[0];
  }

  async createUser(organizationId: string, email: string, passwordHash: string, role: UserRole, client?: any): Promise<User> {
    const q = client ? client.query.bind(client) : query;
    const res = await q(
      'INSERT INTO users (organization_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [organizationId, email, passwordHash, role]
    );
    return res.rows[0];
  }

  async createUserProfile(userId: string, firstName: string, lastName: string, client?: any): Promise<UserProfile> {
    const q = client ? client.query.bind(client) : query;
    const res = await q(
      'INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3) RETURNING *',
      [userId, firstName, lastName]
    );
    return res.rows[0];
  }

  async updateUserProfile(userId: string, data: { firstName?: string | null; lastName?: string | null; jobTitle?: string | null; avatarUrl?: string | null }): Promise<UserProfile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(data.lastName);
    }
    if (data.jobTitle !== undefined) {
      fields.push(`job_title = $${paramIndex++}`);
      values.push(data.jobTitle);
    }
    if (data.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatarUrl);
    }

    if (fields.length === 0) return this.findProfileByUserId(userId);

    values.push(userId);
    const res = await query(
      `UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User | null> {
    const res = await query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [role, userId]
    );
    return res.rows[0] || null;
  }

  async listUsersByOrg(orgId: string): Promise<any[]> {
    const res = await query(
      `SELECT u.id, u.email, u.role, u.is_active as "isActive", u.created_at as "createdAt", up.first_name as "firstName", up.last_name as "lastName", up.job_title as "jobTitle"
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.organization_id = $1
       ORDER BY u.created_at ASC`,
      [orgId]
    );
    return res.rows;
  }

  async deactivateUser(userId: string): Promise<boolean> {
    const res = await query(
      'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
    return (res.rowCount ?? 0) > 0;
  }
}

