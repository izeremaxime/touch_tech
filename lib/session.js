export const CART_COOKIE = 'cart_session';

export const cartCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 90,
};

/** Returns the existing cart session id from the request, or a freshly generated one. */
export function getOrCreateCartSessionId(request) {
  const existing = request.cookies.get(CART_COOKIE)?.value;
  if (existing) return existing;
  // Web Crypto API — available both in Next.js Edge middleware and Node route handlers.
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}
