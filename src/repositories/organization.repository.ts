import { query } from '../config/database';

export interface Organization {
  id: string;
  company_name: string;
  domain: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class OrganizationRepository {
  async findById(id: string): Promise<Organization | null> {
    const res = await query('SELECT * FROM organizations WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async create(companyName: string, domain?: string, client?: any): Promise<Organization> {
    const q = client ? client.query.bind(client) : query;
    const res = await q(
      'INSERT INTO organizations (company_name, domain) VALUES ($1, $2) RETURNING *',
      [companyName, domain || null]
    );
    return res.rows[0];
  }

  async update(id: string, data: { companyName?: string; domain?: string }): Promise<Organization | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.companyName !== undefined) {
      fields.push(`company_name = $${paramIndex++}`);
      values.push(data.companyName);
    }
    if (data.domain !== undefined) {
      fields.push(`domain = $${paramIndex++}`);
      values.push(data.domain);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await query(
      `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  async listAll(): Promise<Organization[]> {
    const res = await query('SELECT * FROM organizations ORDER BY company_name ASC');
    return res.rows;
  }
}
