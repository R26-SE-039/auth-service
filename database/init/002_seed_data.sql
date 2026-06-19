-- Seed data for organizations
INSERT INTO organizations (id, company_name, domain) VALUES
('11111111-1111-1111-1111-111111111111', 'Acme Corp', 'acme.com');

-- Seed data for projects
INSERT INTO projects (id, organization_id, name, description, status) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Website Redesign', 'Redesigning the main corporate website', 'active');

-- Seed data for users (password is "password123" hashed with bcrypt)
INSERT INTO users (id, organization_id, email, password_hash, role) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'admin@acme.com', '$2b$10$EP/257368g0G5z1X/M211OWQnXYKk43q.5iPcdvHh2N0aZ5w5fQd6', 'admin'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'user@acme.com', '$2b$10$EP/257368g0G5z1X/M211OWQnXYKk43q.5iPcdvHh2N0aZ5w5fQd6', 'user');

-- Seed data for project_members
INSERT INTO project_members (project_id, user_id, project_role) VALUES
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'manager'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'developer');

-- Seed data for user_profiles
INSERT INTO user_profiles (id, user_id, first_name, last_name, job_title) VALUES
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Alice', 'Admin', 'Systems Administrator'),
('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'Bob', 'User', 'Software Engineer');
