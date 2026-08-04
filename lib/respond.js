import { NextResponse } from 'next/server';

export function ok(data = {}, init) {
  return NextResponse.json({ status: 'success', ...data }, init);
}

/** Logs the real error server-side but only ever returns a generic message to the client. */
export function fail(status, publicMessage, err) {
  if (err) console.error(publicMessage, err);
  return NextResponse.json({ status: 'error', message: publicMessage }, { status });
}
