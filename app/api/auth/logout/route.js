import { AUTH_COOKIE } from '../../../../lib/auth';
import { ok } from '../../../../lib/respond';

export async function POST() {
  const response = ok({ message: 'Logged out successfully.' });
  response.cookies.set(AUTH_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
