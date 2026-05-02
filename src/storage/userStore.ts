import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { v4 as uuid4 } from 'uuid';
import fs from 'fs';
import path from 'path';

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
  private db: Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async init() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        agile_role TEXT NOT NULL DEFAULT 'Developer',
        created_at TEXT NOT NULL
      )
    `);

    // Migration for agile_role
    const columns = await this.db.all("PRAGMA table_info(users)");
    const hasAgileRole = columns.some(col => col.name === 'agile_role');
    if (!hasAgileRole) {
      await this.db.exec("ALTER TABLE users ADD COLUMN agile_role TEXT NOT NULL DEFAULT 'Developer'");
    }

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        display_name TEXT,
        job_title TEXT,
        bio TEXT,
        timezone TEXT,
        phone TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
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

    await this.db!.run(
      "INSERT INTO users (id, email, password_hash, full_name, agile_role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, user.email, user.password_hash, user.full_name, user.agile_role, user.created_at]
    );

    return user;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.db!.get(
      "SELECT id, email, password_hash, full_name, agile_role, created_at FROM users WHERE email = ?",
      [email.toLowerCase().trim()]
    );
    return row || null;
  }

  async getUserById(userId: string): Promise<UserRecord | null> {
    const row = await this.db!.get(
      "SELECT id, email, password_hash, full_name, agile_role, created_at FROM users WHERE id = ?",
      [userId]
    );
    return row || null;
  }

  async updateUserRole(userId: string, agileRole: string): Promise<UserRecord | null> {
    await this.db!.run(
      "UPDATE users SET agile_role = ? WHERE id = ?",
      [agileRole, userId]
    );
    return this.getUserById(userId);
  }

  async getUserProfile(userId: string): Promise<UserProfileRecord | null> {
    const row = await this.db!.get(
      "SELECT user_id, display_name, job_title, bio, timezone, phone, updated_at FROM user_profiles WHERE user_id = ?",
      [userId]
    );
    return row || null;
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

    await this.db!.run(
      `INSERT INTO user_profiles (user_id, display_name, job_title, bio, timezone, phone, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         display_name = excluded.display_name,
         job_title = excluded.job_title,
         bio = excluded.bio,
         timezone = excluded.timezone,
         phone = excluded.phone,
         updated_at = excluded.updated_at`,
      [
        data.user_id,
        data.display_name?.trim() || null,
        data.job_title?.trim() || null,
        data.bio?.trim() || null,
        data.profile_timezone?.trim() || null,
        data.phone?.trim() || null,
        now
      ]
    );

    const profile = await this.getUserProfile(data.user_id);
    if (!profile) throw new Error("Failed to persist user profile");
    return profile;
  }
}
