import { query } from '../config/database';

export interface ProjectConfiguration {
  id: string;
  project_id: string;
  repo_url: string;
  personal_access_token: string;
  created_at: Date;
  updated_at: Date;
}

export class ProjectConfigurationRepository {
  async findByProjectId(projectId: string): Promise<ProjectConfiguration | null> {
    const res = await query('SELECT * FROM project_configurations WHERE project_id = $1', [projectId]);
    return res.rows[0] || null;
  }

  async upsert(projectId: string, repoUrl: string, personalAccessToken: string): Promise<ProjectConfiguration> {
    const res = await query(
      `INSERT INTO project_configurations (project_id, repo_url, personal_access_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id) 
       DO UPDATE SET repo_url = EXCLUDED.repo_url, 
                     personal_access_token = EXCLUDED.personal_access_token,
                     updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [projectId, repoUrl, personalAccessToken]
    );
    return res.rows[0];
  }

  async delete(projectId: string): Promise<boolean> {
    const res = await query('DELETE FROM project_configurations WHERE project_id = $1', [projectId]);
    return (res.rowCount ?? 0) > 0;
  }
}
