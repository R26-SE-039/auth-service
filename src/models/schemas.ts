import { z } from 'zod';
import { UserRole, ProjectRole } from '../core/types';

export const RegisterRequestSchema = z.object({
  email: z.string().min(5).max(255).email(),
  password: z.string().min(8).max(512),
  companyName: z.string().min(2).max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().min(5).max(255).email(),
  password: z.string().min(8).max(512),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export const UpdateRoleRequestSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;

export const UserProfileUpsertRequestSchema = z.object({
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  avatarUrl: z.string().url().max(1000).optional().nullable(),
});

export type UserProfileUpsertRequest = z.infer<typeof UserProfileUpsertRequestSchema>;

export const ProjectCreateRequestSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional().nullable(),
});

export type ProjectCreateRequest = z.infer<typeof ProjectCreateRequestSchema>;

export const ProjectUpdateRequestSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.string().max(50).optional(),
});

export type ProjectUpdateRequest = z.infer<typeof ProjectUpdateRequestSchema>;

export const ProjectMemberAddRequestSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(ProjectRole).default(ProjectRole.MEMBER),
});

export type ProjectMemberAddRequest = z.infer<typeof ProjectMemberAddRequestSchema>;
