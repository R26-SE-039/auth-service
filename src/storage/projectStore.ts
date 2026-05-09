import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid4 } from 'uuid';

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  is_private: boolean;
  created_at: string;
}

export interface ProjectMembershipRecord {
  project_id: string;
  user_id: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  joined_at: string;
}

export interface ProjectInvitationRecord {
  id: string;
  project_id: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  inviter_id: string;
  status: 'Pending' | 'Accepted' | 'Expired';
  created_at: string;
  expires_at: string;
}

export class ProjectStore {
  private supabase: SupabaseClient;
  private schema: string;

  constructor(supabaseUrl: string, supabaseKey: string, schema: string = 'public') {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.schema = schema;
  }

  /*
  SQL for Project Tables:
  
  create table projects (
    id text primary key,
    name text not null,
    description text,
    owner_id text not null references users(id),
    is_private boolean not null default false,
    created_at timestamp with time zone not null
  );

  create table project_memberships (
    project_id text not null references projects(id) on delete cascade,
    user_id text not null references users(id) on delete cascade,
    role text not null default 'Viewer',
    joined_at timestamp with time zone not null,
    primary key (project_id, user_id)
  );

  create table project_invitations (
    id text primary key,
    project_id text not null references projects(id) on delete cascade,
    email text not null,
    role text not null default 'Editor',
    inviter_id text not null references users(id),
    status text not null default 'Pending',
    created_at timestamp with time zone not null,
    expires_at timestamp with time zone not null
  );
  */

  async createProject(data: { name: string; description: string; owner_id: string; is_private?: boolean }): Promise<ProjectRecord> {
    const project: ProjectRecord = {
      id: `prj-${uuid4()}`,
      name: data.name,
      description: data.description,
      owner_id: data.owner_id,
      is_private: data.is_private ?? false,
      created_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .schema(this.schema)
      .from('projects')
      .insert([project]);

    if (error) throw error;

    // Automatically add owner as Admin
    await this.addMember(project.id, data.owner_id, 'Admin');

    return project;
  }

  async addMember(projectId: string, userId: string, role: 'Admin' | 'Editor' | 'Viewer'): Promise<void> {
    const membership: ProjectMembershipRecord = {
      project_id: projectId,
      user_id: userId,
      role: role,
      joined_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .schema(this.schema)
      .from('project_memberships')
      .insert([membership]);

    if (error) throw error;
  }

  async getUserProjects(userId: string): Promise<(ProjectRecord & { userRole: string; memberCount: number })[]> {
    // This is a complex query that joins memberships with projects and counts members
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from('project_memberships')
      .select(`
        role,
        projects (
          *,
          project_memberships (count)
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    return data.map((item: any) => ({
      ...item.projects,
      userRole: item.role,
      memberCount: item.projects.project_memberships[0].count
    }));
  }

  async getProjectById(projectId: string): Promise<ProjectRecord | null> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async createInvitation(data: { 
    project_id: string; 
    email: string; 
    role: 'Admin' | 'Editor' | 'Viewer'; 
    inviter_id: string 
  }): Promise<ProjectInvitationRecord> {
    const invitation: ProjectInvitationRecord = {
      id: `inv-${uuid4()}`,
      project_id: data.project_id,
      email: data.email.toLowerCase().trim(),
      role: data.role,
      inviter_id: data.inviter_id,
      status: 'Pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    const { error } = await this.supabase
      .schema(this.schema)
      .from('project_invitations')
      .insert([invitation]);

    if (error) throw error;
    return invitation;
  }
}
