import dotenv from 'dotenv';

dotenv.config({ override: true });

const DEFAULT_CORS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

export interface AuthSettings {
  authSecret: string;
  accessTokenTtlMinutes: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigins: string[];
  refreshTokenSecret: string;
  refreshTokenTtlDays: number;
  encryptionKey: string;
  // Email / SMTP
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  // App
  appBaseUrl: string;
}

export function loadSettings(): AuthSettings {
  const rawCors = process.env.AUTH_CORS_ORIGINS || "";
  const corsOrigins = rawCors
    ? rawCors.split(",").map(item => item.trim()).filter(item => item !== "")
    : DEFAULT_CORS;

  const dbUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/user_db";
  
  // Debug log to figure out which password is being used (masked for security)
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
  console.log('[DEBUG] Loading config using Database URL:', maskedUrl);

  return {
    authSecret: process.env.AUTH_SECRET || "dev-change-me-secret",
    accessTokenTtlMinutes: Math.max(5, parseInt(process.env.AUTH_ACCESS_TOKEN_TTL_MINUTES || "120", 10)),
    databaseUrl: dbUrl,
    jwtSecret: process.env.JWT_SECRET || "dev-change-me-secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
    corsOrigins: corsOrigins,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "dev-change-me-refresh-secret",
    refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "7", 10),
    encryptionKey: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-change-me-secret-encryption-key-32-chars-long!",
    // Email
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'no-reply@nextgenqa.local',
    // App
    appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  };
}

