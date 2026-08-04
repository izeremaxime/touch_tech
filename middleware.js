import { NextResponse } from 'next/server';
import { CART_COOKIE, cartCookieOptions, getOrCreateCartSessionId } from './lib/session';

export function middleware(request) {
  if (request.cookies.get(CART_COOKIE)?.value) {
    return NextResponse.next();
  }

  const sessionId = getOrCreateCartSessionId(request);

  // Make the new cookie visible to the route handler on this same request, not just the next one.
  const requestHeaders = new Headers(request.headers);
  const existingCookieHeader = requestHeaders.get('cookie') || '';
  requestHeaders.set(
    'cookie',
    existingCookieHeader
      ? `${existingCookieHeader}; ${CART_COOKIE}=${sessionId}`
      : `${CART_COOKIE}=${sessionId}`
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(CART_COOKIE, sessionId, cartCookieOptions);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
