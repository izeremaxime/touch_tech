import { prisma } from '../../../../lib/prisma';
import { getUserFromRequest } from '../../../../lib/auth';
import { ok } from '../../../../lib/respond';

export async function GET(request) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return ok({ user: null });
  }

  const user = await prisma.users.findUnique({
    where: { id: payload.id },
    select: { id: true, username: true, role: true, created_at: true },
  });
  return ok({ user: user || null });
}
