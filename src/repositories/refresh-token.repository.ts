import { query } from '../config/database';

export interface RefreshTokenRecord {
  jti: string;
  user_id: string;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
}

export class RefreshTokenRepository {
  async create(jti: string, userId: string, expiresAt: Date, client?: any): Promise<RefreshTokenRecord> {
    const q = client ? client.query.bind(client) : query;
    const res = await q(
      'INSERT INTO refresh_tokens (jti, user_id, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [jti, userId, expiresAt]
    );
    return res.rows[0];
  }

  async findByJti(jti: string): Promise<RefreshTokenRecord | null> {
    const res = await query('SELECT * FROM refresh_tokens WHERE jti = $1', [jti]);
    return res.rows[0] || null;
  }

  async revoke(jti: string): Promise<boolean> {
    const res = await query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE jti = $1',
      [jti]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async revokeAllForUser(userId: string): Promise<boolean> {
    const res = await query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
      [userId]
    );
    return (res.rowCount ?? 0) > 0;
  }
}
