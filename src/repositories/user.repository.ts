import { query } from '../config/database';

export class UserRepository {
  async findUserByEmail(email: string) {
    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  }

  async findUserById(id: string) {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
  }

  async createOrganization(companyName: string) {
    const res = await query(
      'INSERT INTO organizations (company_name) VALUES ($1) RETURNING *',
      [companyName]
    );
    return res.rows[0];
  }

  async createUser(organizationId: string, email: string, passwordHash: string, role: string = 'user') {
    const res = await query(
      'INSERT INTO users (organization_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [organizationId, email, passwordHash, role]
    );
    return res.rows[0];
  }

  async createUserProfile(userId: string, firstName: string, lastName: string) {
    const res = await query(
      'INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3) RETURNING *',
      [userId, firstName, lastName]
    );
    return res.rows[0];
  }
}
