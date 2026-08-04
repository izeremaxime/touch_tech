import { prisma } from '../../../../lib/prisma';
import { hashPassword, signAuthToken, AUTH_COOKIE, authCookieOptions } from '../../../../lib/auth';
import { ok, fail } from '../../../../lib/respond';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Invalid request body.');
  }

  const username = (body.username || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const confirmPassword = body.confirmPassword || '';

  if (!username || !email || !password || !confirmPassword) {
    return fail(400, 'All registration fields are required.');
  }
  if (!EMAIL_PATTERN.test(email)) {
    return fail(400, 'Please enter a valid email address.');
  }
  if (password !== confirmPassword) {
    return fail(400, 'Passwords do not match.');
  }
  if (password.length < 6) {
    return fail(400, 'Password must be at least 6 characters long.');
  }

  try {
    const existing = await prisma.users.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });
    if (existing) {
      return fail(409, 'That username or email is already registered.');
    }

    const hashed = await hashPassword(password);
    const created = await prisma.users.create({
      data: { username, email, password: hashed, role: 'user' },
      select: { id: true },
    });

    const user = { id: created.id, username, role: 'user' };
    const token = signAuthToken(user);

    const response = ok({ message: 'Account registered and logged in successfully!', user });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions);
    return response;
  } catch (err) {
    return fail(500, 'Registration failed. Please try again.', err);
  }
}
