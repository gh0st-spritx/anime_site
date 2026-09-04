import { NextResponse, type NextRequest } from 'next/server';

// Next 16 renamed `middleware` to `proxy`. The docs warn against relying on
// shared modules here (it may be CDN-deployed), so this does a cheap cookie
// *presence* check only — a fast redirect for signed-out visitors.
//
// It is NOT the security boundary. Signature verification happens in
// requireAdmin(), which every admin page and every Server Action calls.
const SESSION_COOKIE = 'sh_session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login' || pathname === '/admin/setup') {
    return NextResponse.next();
  }

  if (!request.cookies.get(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
