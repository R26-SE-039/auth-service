import { z } from 'zod';

export const AgileRoleSchema = z.enum([
  "PO",
  "Scrum Master",
  "Developer",
  "QA",
  "BA",
  "UX Designer",
  "DevOps Engineer",
]);

export type AgileRole = z.infer<typeof AgileRoleSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().min(5).max(255).email(),
  password: z.string().min(8).max(512),
  full_name: z.string().max(120).optional().nullable(),
  agile_role: AgileRoleSchema.default("Developer"),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().min(5).max(255).email(),
  password: z.string().min(8).max(512),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export interface UserResponse {
  id: string;
  email: string;
  full_name: string | null;
  agile_role: AgileRole;
  created_at: string;
}

export const UpdateRoleRequestSchema = z.object({
  agile_role: AgileRoleSchema,
});

export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;

export const UserProfileUpsertRequestSchema = z.object({
  display_name: z.string().max(120).optional().nullable(),
  job_title: z.string().max(120).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  timezone: z.string().max(80).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
});

export type UserProfileUpsertRequest = z.infer<typeof UserProfileUpsertRequestSchema>;

export interface UserProfileResponse {
  user_id: string;
  display_name: string | null;
  job_title: string | null;
  bio: string | null;
  timezone: string | null;
  phone: string | null;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserResponse;
}

// Projects
export const ProjectCreateRequestSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  is_private: z.boolean().default(false),
});

export type ProjectCreateRequest = z.infer<typeof ProjectCreateRequestSchema>;

export const ProjectInviteRequestSchema = z.object({
  email: z.string().email(),
  role: z.enum(["Admin", "Editor", "Viewer"]).default("Editor"),
});

export type ProjectInviteRequest = z.infer<typeof ProjectInviteRequestSchema>;

export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  is_private: boolean;
  userRole: string;
  memberCount: number;
  created_at: string;
}
