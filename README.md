# Authentication Service (Node.js)

This is a Node.js-based authentication microservice, converted from a Python FastAPI implementation. It provides secure user registration, login, profile management, and role-based access control using TypeScript and Supabase.

## 🚀 Features
- **JWT-based Authentication**: Secure token generation and validation.
- **Custom Password Hashing**: PBKDF2 with SHA256 (matches original Python parity).
- **Supabase Integration**: Cloud-based PostgreSQL storage.
- **Zod Validation**: Robust request body validation.
- **Role Management**: Support for Agile roles (PO, Scrum Master, Developer, etc.).

## 🛠️ Technology Stack
- **Runtime**: Node.js (v18+)
- **Language**: TypeScript (ESM)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: pnpm

## ⚙️ Setup Instructions

### 1. Prerequisites
- [pnpm](https://pnpm.io/installation) installed globally.
- A [Supabase](https://supabase.com/) project.

### 2. Installation
```bash
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and copy the contents from `.env.example`:
```env
PORT=8000
AUTH_SECRET=your-secret-key
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-secret-key
```

### 4. Database Schema Setup
Run the following SQL script in your Supabase **SQL Editor** to create the required tables:

```sql
-- Create Users Table
create table users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  full_name text,
  agile_role text not null default 'Developer',
  created_at timestamp with time zone not null
);

-- Create User Profiles Table
create table user_profiles (
  user_id text primary key references users(id),
  display_name text,
  job_title text,
  bio text,
  timezone text,
  phone text,
  updated_at timestamp with time zone not null
);

-- Disable RLS for backend service access
alter table users disable row level security;
alter table user_profiles disable row level security;
```

## 🏃 Running the Service

### Development Mode
```bash
pnpm dev
```

### Production Build
```bash
pnpm build
pnpm start
```

## 📖 API Documentation
All API endpoints are documented and available as a Postman collection in the `docs/` folder.

- **Health Check**: `GET /health`
- **Register**: `POST /auth/register`
- **Login**: `POST /auth/login`
- **Get Profile**: `GET /auth/profile`
- **Update Role**: `PATCH /auth/role`

Detailed usage instructions can be found in [docs/README.md](./docs/README.md).
