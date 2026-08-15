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

// ─── Invitation Schemas ────────────────────────────────────────────────────

export const CreateInviteRequestSchema = z.object({
  email: z.string().email().max(255),
  role: z.nativeEnum(UserRole).refine(
    val => val !== UserRole.ORGANIZATION_OWNER,
    { message: 'Cannot invite a user with the ORGANIZATION_OWNER role.' }
  ),
});

export type CreateInviteRequest = z.infer<typeof CreateInviteRequestSchema>;

export const AcceptInviteRequestSchema = z.object({
  inviteToken: z.string().min(64).max(64),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8).max(512),
});

export type AcceptInviteRequest = z.infer<typeof AcceptInviteRequestSchema>;

// ─── Iteration Schemas ────────────────────────────────────────────────────

export const CreateIterationRequestSchema = z.object({
  name: z.string().min(1).max(255),
  goal: z.string().max(2000).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be in YYYY-MM-DD format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be in YYYY-MM-DD format'),
}).refine(
  (data) => new Date(data.end_date) > new Date(data.start_date),
  { message: 'end_date must be after start_date', path: ['end_date'] }
);

export type CreateIterationRequest = z.infer<typeof CreateIterationRequestSchema>;

export const UpdateIterationRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  goal: z.string().max(2000).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be in YYYY-MM-DD format').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be in YYYY-MM-DD format').optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
  },
  { message: 'end_date must be after start_date', path: ['end_date'] }
);

export type UpdateIterationRequest = z.infer<typeof UpdateIterationRequestSchema>;

export const SaveConfigurationRequestSchema = z.object({
  repoUrl: z.string().min(1).max(2048),
  personalAccessToken: z.string().min(1).max(4096),
});

export type SaveConfigurationRequest = z.infer<typeof SaveConfigurationRequestSchema>;
