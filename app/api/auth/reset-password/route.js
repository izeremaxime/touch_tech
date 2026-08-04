import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/auth';
import { ok, fail } from '../../../../lib/respond';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Invalid request body.');
  }

  const token = (body.token || '').trim();
  const newPassword = body.newPassword || '';
  const confirmNewPassword = body.confirmNewPassword || '';

  if (!token) {
    return fail(400, 'Missing reset token.');
  }
  if (!newPassword || !confirmNewPassword) {
    return fail(400, 'Please enter and confirm your new password.');
  }
  if (newPassword !== confirmNewPassword) {
    return fail(400, 'Passwords do not match.');
  }
  if (newPassword.length < 6) {
    return fail(400, 'Password must be at least 6 characters long.');
  }

  try {
    const reset = await prisma.password_resets.findUnique({
      where: { token },
      select: { id: true, user_id: true, expires_at: true, used_at: true },
    });

    if (!reset || reset.used_at || new Date(reset.expires_at) < new Date()) {
      return fail(400, 'This reset link is invalid or has expired. Please request a new one.');
    }

    const hashed = await hashPassword(newPassword);
    await prisma.users.update({ where: { id: reset.user_id }, data: { password: hashed } });
    await prisma.password_resets.update({ where: { id: reset.id }, data: { used_at: new Date() } });

    return ok({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    return fail(500, 'Could not reset password.', err);
  }
}
