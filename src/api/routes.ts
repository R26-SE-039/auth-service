import { Router, Request, Response, NextFunction } from 'express';
import { UserStore } from '../storage/userStore';
import { ProjectStore } from '../storage/projectStore';
import { 
  hashPassword, 
  verifyPassword, 
  createAccessToken, 
  decodeAccessToken 
} from '../core/security';
import { 
  RegisterRequestSchema, 
  LoginRequestSchema, 
  UpdateRoleRequestSchema, 
  UserProfileUpsertRequestSchema,
  UserResponse,
  UserProfileResponse,
  ProjectCreateRequestSchema,
  ProjectInviteRequestSchema,
  ProjectResponse
} from '../models/schemas';
import { ZodError } from 'zod';

export function buildRouter(
  userStore: UserStore, 
  projectStore: ProjectStore,
  authSecret: string, 
  tokenTtlMinutes: number
): Router {
  const router = Router();

  const validateEmail = (email: string): string => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@") || normalized.startsWith("@") || normalized.endsWith("@")) {
      throw { status: 400, message: "Invalid email format" };
    }
    return normalized;
  };

  const toUserResponse = (user: any): UserResponse => ({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    agile_role: user.agile_role,
    created_at: user.created_at,
  });

  const toProfileResponse = (profile: any): UserProfileResponse => ({
    user_id: profile.user_id,
    display_name: profile.display_name,
    job_title: profile.job_title,
    bio: profile.bio,
    timezone: profile.timezone,
    phone: profile.phone,
    updated_at: profile.updated_at,
  });

  const extractToken = (authHeader?: string): string => {
    if (!authHeader) throw { status: 401, message: "Missing Authorization header" };
    const [bearer, token] = authHeader.split(" ");
    if (bearer?.toLowerCase() !== "bearer" || !token) {
      throw { status: 401, message: "Invalid Authorization header" };
    }
    return token;
  };

  const getCurrentUser = async (authHeader: string | undefined) => {
    const token = extractToken(authHeader);
    let payload;
    try {
      payload = decodeAccessToken(token, authSecret);
    } catch (err: any) {
      throw { status: 401, message: err.message };
    }

    const user = await userStore.getUserById(payload.sub);
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  };

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: "ok", service: "auth" });
  });

  // Register
  router.post('/auth/register', async (req, res, next) => {
    try {
      const body = RegisterRequestSchema.parse(req.body);
      const email = validateEmail(body.email);

      const existing = await userStore.getUserByEmail(email);
      if (existing) return res.status(409).json({ detail: "User already exists" });

      const user = await userStore.createUser({
        email,
        password_hash: hashPassword(body.password),
        full_name: body.full_name || null,
        agile_role: body.agile_role
      });

      const token = createAccessToken(user.id, authSecret, tokenTtlMinutes);
      res.status(201).json({
        access_token: token,
        token_type: "bearer",
        expires_in: tokenTtlMinutes * 60,
        user: toUserResponse(user),
      });
    } catch (err) {
      next(err);
    }
  });

  // Login
  router.post('/auth/login', async (req, res, next) => {
    try {
      const body = LoginRequestSchema.parse(req.body);
      const email = validateEmail(body.email);
      const user = await userStore.getUserByEmail(email);

      if (!user || !verifyPassword(body.password, user.password_hash)) {
        return res.status(401).json({ detail: "Invalid credentials" });
      }

      const token = createAccessToken(user.id, authSecret, tokenTtlMinutes);
      res.json({
        access_token: token,
        token_type: "bearer",
        expires_in: tokenTtlMinutes * 60,
        user: toUserResponse(user),
      });
    } catch (err) {
      next(err);
    }
  });

  // Me
  router.get('/auth/me', async (req, res, next) => {
    try {
      const user = await getCurrentUser(req.headers.authorization);
      res.json(toUserResponse(user));
    } catch (err) {
      next(err);
    }
  });

  // Update Role
  router.patch('/auth/role', async (req, res, next) => {
    try {
      const user = await getCurrentUser(req.headers.authorization);
      const body = UpdateRoleRequestSchema.parse(req.body);
      const updatedUser = await userStore.updateUserRole(user.id, body.agile_role);
      if (!updatedUser) return res.status(404).json({ detail: "User not found" });
      res.json(toUserResponse(updatedUser));
    } catch (err) {
      next(err);
    }
  });

  // Roles
  router.get('/auth/roles', (req, res) => {
    res.json({
      roles: [
        "PO",
        "Scrum Master",
        "Developer",
        "QA",
        "BA",
        "UX Designer",
        "DevOps Engineer",
      ]
    });
  });

  // Get Profile
  router.get('/auth/profile', async (req, res, next) => {
    try {
      const user = await getCurrentUser(req.headers.authorization);
      const profile = await userStore.getUserProfile(user.id);
      if (!profile) return res.status(404).json({ detail: "Profile not found" });
      res.json(toProfileResponse(profile));
    } catch (err) {
      next(err);
    }
  });

  // Upsert Profile
  router.put('/auth/profile', async (req, res, next) => {
    try {
      const user = await getCurrentUser(req.headers.authorization);
      const body = UserProfileUpsertRequestSchema.parse(req.body);
      const profile = await userStore.upsertUserProfile({
        user_id: user.id,
        display_name: body.display_name || null,
        job_title: body.job_title || null,
        bio: body.bio || null,
        profile_timezone: body.timezone || null,
        phone: body.phone || null,
      });
      res.json(toProfileResponse(profile));
    } catch (err) {
      next(err);
    }
  });

  // PROJECTS

  // List user projects
  router.get('/projects', async (req, res, next) => {
    try {
      const user = await getCurrentUser(req.headers.authorization);
      const projects = await projectStore.getUserProjects(user.id);
      res.json(projects);
    } catch (err) {
      next(err);
    }
  });

  // Create project
  router.post('/projects', async (req, res, next) => {
    try {
      const user = await getCurrentUser(req.headers.authorization);
      const body = ProjectCreateRequestSchema.parse(req.body);
      
      const project = await projectStore.createProject({
        name: body.name,
        description: body.description || "",
        owner_id: user.id,
        is_private: body.is_private
      });

      // Fetch the project again with full metadata (role, memberCount)
      const userProjects = await projectStore.getUserProjects(user.id);
      const fullProject = userProjects.find(p => p.id === project.id);
      
      res.status(201).json(fullProject || project);
    } catch (err) {
      next(err);
    }
  });

  // Invite member to project
  router.post('/projects/:id/invite', async (req, res, next) => {
    try {
      const user = await getCurrentUser(req.headers.authorization);
      const projectId = req.params.id;
      const body = ProjectInviteRequestSchema.parse(req.body);

      // Verify the inviter has access to the project
      const projects = await projectStore.getUserProjects(user.id);
      const project = projects.find(p => p.id === projectId);

      if (!project) return res.status(404).json({ detail: "Project not found" });
      if (project.userRole !== 'Admin') {
        return res.status(403).json({ detail: "Only admins can invite members" });
      }

      const invitation = await projectStore.createInvitation({
        project_id: projectId,
        email: body.email,
        role: body.role,
        inviter_id: user.id
      });

      res.status(201).json(invitation);
    } catch (err) {
      next(err);
    }
  });

  // Error handling middleware
  router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ detail: err.issues });
    }
    if (err.status) {
      return res.status(err.status).json({ detail: err.message });
    }
    console.error(err);
    res.status(500).json({ detail: "Internal Server Error" });
  });

  return router;
}
