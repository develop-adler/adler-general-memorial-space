import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EXCLUDED_PATHS = [
  '/static/',
  '/_next/',
  '/.well-known',
  '/babylonjs/'
];

const isExcludedPath = (pathname: string) =>
  EXCLUDED_PATHS.some((path) => pathname.startsWith(path));

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const isPostPath =
    pathname === '/posts' ||
    pathname.startsWith('/posts/') ||
    pathname === '/general-memorial';
  const isHomePage = pathname === '/';

  if (isPostPath && pathname !== '/general-memorial') {
    const url = request.nextUrl.clone();
    url.pathname = '/general-memorial';
    return NextResponse.redirect(url);
  }

  const isAllowedPath = isPostPath || isHomePage;

  if (!isAllowedPath) {
    console.log('Redirecting to home page from:', pathname);
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|sw.js|.well-known).*)'],
};
