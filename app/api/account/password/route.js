import { prisma } from '../../../../lib/prisma';
import { getUserFromRequest, hashPassword, verifyPassword } from '../../../../lib/auth';
import { ok, fail } from '../../../../lib/respond';

export async function PUT(request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return fail(401, 'Please log in.');
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Invalid request body.');
  }

  const currentPassword = body.currentPassword || '';
  const newPassword = body.newPassword || '';
  const confirmNewPassword = body.confirmNewPassword || '';

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return fail(400, 'All password fields are required.');
  }
  if (newPassword !== confirmNewPassword) {
    return fail(400, 'New passwords do not match.');
  }
  if (newPassword.length < 6) {
    return fail(400, 'New password must be at least 6 characters long.');
  }

  try {
    const dbUser = await prisma.users.findUnique({ where: { id: user.id } });
    if (!dbUser || !(await verifyPassword(currentPassword, dbUser.password))) {
      return fail(401, 'Current password is incorrect.');
    }

    const hashed = await hashPassword(newPassword);
    await prisma.users.update({ where: { id: user.id }, data: { password: hashed } });

    return ok({ message: 'Password updated successfully.' });
  } catch (err) {
    return fail(500, 'Could not update password.', err);
  }
}
