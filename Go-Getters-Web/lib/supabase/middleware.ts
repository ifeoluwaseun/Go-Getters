import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Safeguard against missing environment variables on Vercel
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are missing! Skipping middleware session update.");
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Retrieve current auth user session
    const { data: { user } } = await supabase.auth.getUser();

    // Route paths
    const pathname = request.nextUrl.pathname;
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isStaticAsset = pathname.includes('.') || pathname.startsWith('/_next') || pathname.startsWith('/api');

    if (isStaticAsset) {
      return supabaseResponse;
    }

    // Redirect logic:
    if (!user && !isAuthRoute && pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (error) {
    console.error("Supabase middleware error:", error);
  }

  return supabaseResponse;
}
