import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { InviteRepository } from '../repositories/invite.repository';
import { UserRepository } from '../repositories/user.repository';
import { UserRole } from '../core/types';
import { hashPassword, generateAccessToken, generateRefreshToken } from '../core/security';
import { getClient } from '../config/database';
import { loadSettings } from '../config/config';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

const settings = loadSettings();

// Configure nodemailer transporter.
// In development, emails are caught by Ethereal (fake SMTP).
// In production, replace with your real SMTP credentials.
let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporterPromise) return transporterPromise;

  if (settings.smtpHost && settings.smtpUser && settings.smtpPass) {
    // Production: use configured SMTP (e.g. SendGrid, SES, Mailgun)
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });
    transporterPromise = Promise.resolve(transporter);
  } else {
    // Development: auto-create a free Ethereal test account
    transporterPromise = nodemailer.createTestAccount().then(testAccount => {
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('[EMAIL] Using Ethereal test account:', testAccount.user);
      return transporter;
    });
  }
  return transporterPromise;
}

export class InviteService {
  private inviteRepository = new InviteRepository();
  private userRepository = new UserRepository();
  private refreshTokenRepository = new RefreshTokenRepository();

  private readonly INVITE_TTL_HOURS = 48;

  async createInvite(
    inviterUserId: string,
    inviterOrgId: string,
    email: string,
    role: UserRole
  ): Promise<{ inviteId: string; email: string; expiresAt: Date }> {
    // Admins cannot invite another ORGANIZATION_OWNER
    if (role === UserRole.ORGANIZATION_OWNER) {
      throw new Error('Cannot invite a user with the ORGANIZATION_OWNER role.');
    }

    // Check if the email already belongs to an existing user
    const existingUser = await this.userRepository.findUserByEmail(email);
    if (existingUser) {
      throw new Error('A user with this email address already exists in the system.');
    }

    // Check for a still-pending invite for this email in the same org
    const existingInvite = await this.inviteRepository.findPendingByEmail(email, inviterOrgId);
    if (existingInvite) {
      throw new Error('A pending invitation for this email address already exists. Please wait for it to expire or cancel it first.');
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.INVITE_TTL_HOURS);

    const invite = await this.inviteRepository.create(
      inviterOrgId,
      inviterUserId,
      email,
      role,
      inviteToken,
      expiresAt
    );

    // Send the invitation email
    await this.sendInviteEmail(email, inviteToken, inviterOrgId, expiresAt);

    return { inviteId: invite.id, email: invite.email, expiresAt: invite.expires_at };
  }

  async acceptInvite(
    inviteToken: string,
    firstName: string,
    lastName: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string; user: object }> {
    const invite = await this.inviteRepository.findByToken(inviteToken);

    if (!invite) {
      throw new Error('Invitation not found. The link may be invalid or has already been used.');
    }
    if (invite.accepted) {
      throw new Error('This invitation has already been accepted.');
    }
    if (new Date() > new Date(invite.expires_at)) {
      throw new Error('This invitation has expired. Please request a new one from the organization administrator.');
    }

    // Check again — the invited email must not yet have an account
    const existingUser = await this.userRepository.findUserByEmail(invite.email);
    if (existingUser) {
      throw new Error('A user with this email already exists.');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const passwordHash = await hashPassword(password);
      const user = await this.userRepository.createUser(invite.organization_id, invite.email, passwordHash, invite.role, client);
      await this.userRepository.createUserProfile(user.id, firstName, lastName, client);
      await this.inviteRepository.markAccepted(inviteToken);

      await client.query('COMMIT');

      // Issue tokens
      const jti = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + settings.refreshTokenTtlDays);
      await this.refreshTokenRepository.create(jti, user.id, expiresAt);

      const jwtPayload = {
        userId: user.id,
        organizationId: user.organization_id,
        role: user.role,
        email: user.email,
      };
      const accessToken = generateAccessToken(jwtPayload, settings.jwtSecret, settings.accessTokenTtlMinutes);
      const refreshToken = generateRefreshToken({ userId: user.id, jti }, settings.refreshTokenSecret, settings.refreshTokenTtlDays);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organization_id,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listInvites(organizationId: string) {
    return this.inviteRepository.listByOrganization(organizationId);
  }

  async revokeInvite(inviteId: string, organizationId: string): Promise<void> {
    const deleted = await this.inviteRepository.deleteById(inviteId, organizationId);
    if (!deleted) {
      throw new Error('Invitation not found or you do not have permission to revoke it.');
    }
  }

  private async sendInviteEmail(
    toEmail: string,
    inviteToken: string,
    orgId: string,
    expiresAt: Date
  ): Promise<void> {
    try {
      const transporter = await getTransporter();

      const acceptUrl = `${settings.appBaseUrl}/accept-invite?token=${inviteToken}`;
      const expiryStr = expiresAt.toUTCString();

      const info = await transporter.sendMail({
        from: `"NextGenQA Auth" <${settings.smtpFrom}>`,
        to: toEmail,
        subject: 'You have been invited to join an organization on NextGenQA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">You've Been Invited!</h2>
            <p>You have been invited to join an organization on <strong>NextGenQA</strong>.</p>
            <p>Click the button below to accept your invitation and create your account. This link expires on <strong>${expiryStr}</strong>.</p>
            <a href="${acceptUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Accept Invitation</a>
            <p style="color: #666; font-size: 12px;">Or paste this URL into your browser:<br/>${acceptUrl}</p>
            <p style="color: #666; font-size: 12px;">If you did not expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      });

      // Log the Ethereal preview URL in development
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('[EMAIL] Invite email preview URL (Ethereal):', previewUrl);
      }
    } catch (err) {
      // Non-fatal: log but don't crash the request if email delivery fails
      console.error('[EMAIL] Failed to send invitation email:', err);
    }
  }
}
