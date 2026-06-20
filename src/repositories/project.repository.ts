import { query } from '../config/database';

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: Date;
}

export class ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const res = await query('SELECT * FROM projects WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findByOrgId(orgId: string): Promise<Project[]> {
    const res = await query('SELECT * FROM projects WHERE organization_id = $1 ORDER BY created_at DESC', [orgId]);
    return res.rows;
  }

  async create(organizationId: string, name: string, description?: string | null, client?: any): Promise<Project> {
    const q = client ? client.query.bind(client) : query;
    const res = await q(
      'INSERT INTO projects (organization_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [organizationId, name, description || null]
    );
    return res.rows[0];
  }

  async update(id: string, data: { name?: string; description?: string | null; status?: string }): Promise<Project | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const res = await query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM projects WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async listProjectsForMember(userId: string, orgId: string): Promise<Project[]> {
    const res = await query(
      `SELECT p.* FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1 AND p.organization_id = $2
       ORDER BY p.created_at DESC`,
      [userId, orgId]
    );
    return res.rows;
  }
}
