import { query } from '../config/database';
import { IterationStatus } from '../core/types';

export interface Iteration {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: IterationStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateIterationData {
  name: string;
  goal?: string | null;
  start_date: string;
  end_date: string;
}

export interface UpdateIterationData {
  name?: string;
  goal?: string | null;
  start_date?: string;
  end_date?: string;
  status?: IterationStatus;
}

export class IterationRepository {
  async findById(id: string): Promise<Iteration | null> {
    const res = await query('SELECT * FROM iterations WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findByProjectId(projectId: string): Promise<Iteration[]> {
    const res = await query(
      'SELECT * FROM iterations WHERE project_id = $1 ORDER BY start_date ASC',
      [projectId]
    );
    return res.rows;
  }

  async findActiveByProjectId(projectId: string): Promise<Iteration | null> {
    const res = await query(
      "SELECT * FROM iterations WHERE project_id = $1 AND status = 'ACTIVE'",
      [projectId]
    );
    return res.rows[0] || null;
  }

  async create(
    projectId: string,
    data: CreateIterationData,
    createdBy: string,
    client?: any
  ): Promise<Iteration> {
    const q = client ? client.query.bind(client) : query;
    const res = await q(
      `INSERT INTO iterations (project_id, name, goal, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [projectId, data.name, data.goal ?? null, data.start_date, data.end_date, createdBy]
    );
    return res.rows[0];
  }

  async update(id: string, data: UpdateIterationData): Promise<Iteration | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.goal !== undefined) {
      fields.push(`goal = $${paramIndex++}`);
      values.push(data.goal);
    }
    if (data.start_date !== undefined) {
      fields.push(`start_date = $${paramIndex++}`);
      values.push(data.start_date);
    }
    if (data.end_date !== undefined) {
      fields.push(`end_date = $${paramIndex++}`);
      values.push(data.end_date);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    if (fields.length === 0) return this.findById(id);

    // Always update the updated_at timestamp
    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE iterations SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM iterations WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
