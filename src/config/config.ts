import dotenv from 'dotenv';

dotenv.config();

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
}

export function loadSettings(): AuthSettings {
  const rawCors = process.env.AUTH_CORS_ORIGINS || "";
  const corsOrigins = rawCors
    ? rawCors.split(",").map(item => item.trim()).filter(item => item !== "")
    : DEFAULT_CORS;

  return {
    authSecret: process.env.AUTH_SECRET || "dev-change-me-secret",
    accessTokenTtlMinutes: Math.max(5, parseInt(process.env.AUTH_ACCESS_TOKEN_TTL_MINUTES || "120", 10)),
    databaseUrl: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/user_db",
    jwtSecret: process.env.JWT_SECRET || "dev-change-me-secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
    corsOrigins: corsOrigins,
  };
}
