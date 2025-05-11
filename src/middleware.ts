import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPostPath = pathname === '/posts' || /^\/posts\/[^\/]+$/.test(pathname);

  if (isPostPath) {
    if (pathname !== '/general-memorial') {
      const url = request.nextUrl.clone();
      url.pathname = '/general-memorial';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
