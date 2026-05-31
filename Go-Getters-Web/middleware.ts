// 1. Define __dirname globally in the Vercel Edge Runtime to prevent ReferenceErrors
// in CommonJS dependencies (like ua-parser-js used by next/server userAgent utilities)
if (typeof (globalThis as any).__dirname === 'undefined') {
  (globalThis as any).__dirname = '/';
}

import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    // 2. Dynamically import the session handler to ensure our global __dirname
    // safeguard is fully defined BEFORE the module and its dependencies are evaluated!
    const { updateSession } = await import('./lib/supabase/middleware');
    return await updateSession(request);
  } catch (error) {
    console.error("Middleware initialization failure:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
