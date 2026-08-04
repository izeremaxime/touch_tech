import crypto from 'crypto';
import { prisma } from '../../../../lib/prisma';
import { sendPasswordResetEmail } from '../../../../lib/mailer';
import { ok, fail } from '../../../../lib/respond';

const TOKEN_TTL_MINUTES = 30;
const GENERIC_MESSAGE = "If that email is registered, we've sent a password reset link to it.";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Invalid request body.');
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email) {
    return fail(400, 'Please enter your email address.');
  }

  try {
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, username: true, email: true },
    });

    // Always respond the same way whether or not the email is registered, to avoid leaking which emails exist.
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

      await prisma.password_resets.create({
        data: { user_id: user.id, token, expires_at: expiresAt },
      });

      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password.html?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    return ok({ message: GENERIC_MESSAGE });
  } catch (err) {
    return fail(500, 'Could not process password reset request.', err);
  }
}
