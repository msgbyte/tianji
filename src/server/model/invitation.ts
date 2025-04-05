import { prisma } from './_client.js';
import { ROLES } from '@tianji/shared';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { sendEmail } from '../utils/smtp.js';
import { joinWorkspace } from './user.js';
import dayjs from 'dayjs';

/**
 * Create workspace invitation
 */
export async function createWorkspaceInvitation(
  workspaceId: string,
  inviterId: string,
  email: string,
  role: ROLES = ROLES.readOnly
) {
  // Generate unique invitation token
  const token = randomUUID();
  // Default 7-day validity period
  const expiresAt = dayjs().add(7, 'days').toDate();

  try {
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        email,
        workspaceId,
        inviterId,
        role,
        token,
        expiresAt,
      },
      include: {
        workspace: {
          select: {
            name: true,
          },
        },
        inviter: {
          select: {
            username: true,
            nickname: true,
          },
        },
      },
    });

    return invitation;
  } catch (err) {
    logger.error('Failed to create workspace invitation', err);
    throw new Error('Failed to create invitation');
  }
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  invitationId: string,
  baseUrl: string
) {
  try {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        workspace: {
          select: {
            name: true,
          },
        },
        inviter: {
          select: {
            username: true,
            nickname: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invitation does not exist');
    }

    const inviterName =
      invitation.inviter.nickname || invitation.inviter.username;
    const invitationLink = `${baseUrl}/invitation/accept/${invitation.token}`;

    // Send invitation email
    await sendEmail({
      to: invitation.email,
      subject: `You are invited to join workspace ${invitation.workspace.name}`,
      body: `
        <p>Hello,</p>
        <p>${inviterName} invites you to join workspace "${invitation.workspace.name}".</p>
        <p>Please click the button below to accept the invitation:</p>
        <p><a href="${invitationLink}">${invitationLink}</a></p>
        <p>This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}.</p>
      `,
      button: {
        url: invitationLink,
        title: 'Accept Invitation',
      },
    });

    return true;
  } catch (err) {
    logger.error('Failed to send invitation email', err);
    throw new Error('Failed to send invitation email');
  }
}

/**
 * Verify and accept invitation
 */
export async function acceptInvitation(token: string, userId: string) {
  try {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: {
        token,
      },
    });

    if (!invitation) {
      throw new Error('Invitation does not exist');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation has been processed');
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      throw new Error('Invitation has expired');
    }

    // Use existing joinWorkspace function to add user to workspace
    await joinWorkspace(
      userId,
      invitation.workspaceId,
      invitation.role as ROLES
    );

    // Update invitation status
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted' },
    });

    return {
      workspaceId: invitation.workspaceId,
      role: invitation.role,
    };
  } catch (err) {
    logger.error('Failed to accept invitation', err);
    throw new Error(
      'Failed to accept invitation: ' +
        (err instanceof Error ? err.message : String(err))
    );
  }
}
