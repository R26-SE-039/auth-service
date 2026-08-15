export enum UserRole {
  ORGANIZATION_OWNER = 'ORGANIZATION_OWNER',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  PROJECT_OWNER = 'PROJECT_OWNER',
  MEMBER = 'MEMBER',
}

export enum ProjectRole {
  PROJECT_OWNER = 'PROJECT_OWNER',
  MEMBER = 'MEMBER',
}

export enum IterationStatus {
  PLANNING  = 'PLANNING',
  ACTIVE    = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface JwtPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  jti: string;
}
