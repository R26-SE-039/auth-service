import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid4 } from 'uuid';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  agile_role: string;
  created_at: string;
}

export interface UserProfileRecord {
  user_id: string;
  display_name: string | null;
  job_title: string | null;
  bio: string | null;
  timezone: string | null;
  phone: string | null;
  updated_at: string;
}

export class UserStore {
  private supabase: SupabaseClient;
  private schema: string;

  constructor(supabaseUrl: string, supabaseKey: string, schema: string = 'public') {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL and Key are required");
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.schema = schema;
  }

  // We assume tables 'users' and 'user_profiles' exist in Supabase.
  // SQL for tables:
  /*
  create table users (
    id text primary key,
    email text not null unique,
    password_hash text not null,
    full_name text,
    agile_role text not null default 'Developer',
    created_at timestamp with time zone not null
  );

  create table user_profiles (
    user_id text primary key references users(id),
    display_name text,
    job_title text,
    bio text,
    timezone text,
    phone text,
    updated_at timestamp with time zone not null
  );
  */

  async init() {
    // No-op for Supabase as it's a managed service.
    // In a real app, you might run migrations here or use Prisma/Drizzle.
  }

  async createUser(data: { email: string; password_hash: string; full_name: string | null; agile_role: string }): Promise<UserRecord> {
    const user: UserRecord = {
      id: `usr-${uuid4()}`,
      email: data.email.toLowerCase().trim(),
      password_hash: data.password_hash,
      full_name: data.full_name?.trim() || null,
      agile_role: data.agile_role,
      created_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .schema(this.schema)
      .from('users')
      .insert([user]);

    if (error) throw error;
    return user;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data || null;
  }

  async getUserById(userId: string): Promise<UserRecord | null> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async updateUserRole(userId: string, agileRole: string): Promise<UserRecord | null> {
    const { error } = await this.supabase
      .schema(this.schema)
      .from('users')
      .update({ agile_role: agileRole })
      .eq('id', userId);

    if (error) throw error;
    return this.getUserById(userId);
  }

  async getUserProfile(userId: string): Promise<UserProfileRecord | null> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async upsertUserProfile(data: {
    user_id: string;
    display_name: string | null;
    job_title: string | null;
    bio: string | null;
    profile_timezone: string | null;
    phone: string | null;
  }): Promise<UserProfileRecord> {
    const now = new Date().toISOString();

    const { error } = await this.supabase
      .schema(this.schema)
      .from('user_profiles')
      .upsert({
        user_id: data.user_id,
        display_name: data.display_name?.trim() || null,
        job_title: data.job_title?.trim() || null,
        bio: data.bio?.trim() || null,
        timezone: data.profile_timezone?.trim() || null,
        phone: data.phone?.trim() || null,
        updated_at: now
      }, { onConflict: 'user_id' });

    if (error) throw error;

    const profile = await this.getUserProfile(data.user_id);
    if (!profile) throw new Error("Failed to persist user profile");
    return profile;
  }
}
