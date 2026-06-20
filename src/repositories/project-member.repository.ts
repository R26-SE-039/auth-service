import { query } from '../config/database';
import { ProjectRole } from '../core/types';

export interface ProjectMember {
  project_id: string;
  user_id: string;
  project_role: ProjectRole;
  join_at: Date;
}

export interface ProjectMemberDetail {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  projectRole: ProjectRole;
  joinAt: Date;
}

export class ProjectMemberRepository {
  async addMember(projectId: string, userId: string, role: ProjectRole, client?: any): Promise<ProjectMember> {
    const q = client ? client.query.bind(client) : query;
    const res = await q(
      'INSERT INTO project_members (project_id, user_id, project_role) VALUES ($1, $2, $3) RETURNING *',
      [projectId, userId, role]
    );
    return res.rows[0];
  }

  async removeMember(projectId: string, userId: string): Promise<boolean> {
    const res = await query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async getMemberRole(projectId: string, userId: string): Promise<ProjectRole | null> {
    const res = await query(
      'SELECT project_role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    return res.rows[0]?.project_role || null;
  }

  async listMembers(projectId: string): Promise<ProjectMemberDetail[]> {
    const res = await query(
      `SELECT pm.user_id as "userId", u.email, up.first_name as "firstName", up.last_name as "lastName", pm.project_role as "projectRole", pm.join_at as "joinAt"
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.join_at ASC`,
      [projectId]
    );
    return res.rows;
  }
}
