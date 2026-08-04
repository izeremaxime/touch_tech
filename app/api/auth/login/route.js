import { prisma } from '../../../../lib/prisma';
import { verifyPassword, signAuthToken, AUTH_COOKIE, authCookieOptions } from '../../../../lib/auth';
import { ok, fail } from '../../../../lib/respond';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Invalid request body.');
  }

  const username = (body.username || '').trim();
  const password = body.password || '';
  const selectedRole = body.role === 'admin' ? 'admin' : 'user';

  if (!username || !password) {
    return fail(400, 'Please enter username and password.');
  }

  try {
    const dbUser = await prisma.users.findUnique({ where: { username } });

    if (!dbUser || !(await verifyPassword(password, dbUser.password))) {
      return fail(401, 'Invalid username or password.');
    }

    if (dbUser.role !== selectedRole) {
      const expected = dbUser.role === 'admin' ? 'Admin' : 'Customer';
      return fail(401, `This account is registered as "${expected}". Please switch the toggle and try again.`);
    }

    const user = { id: dbUser.id, username: dbUser.username, role: dbUser.role };
    const token = signAuthToken(user);

    const response = ok({ message: `Welcome back, ${dbUser.username}!`, user });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions);
    return response;
  } catch (err) {
    return fail(500, 'Login failed. Please try again.', err);
  }
}
