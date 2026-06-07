import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS  = ['/login', '/approval']
const SETUP_PATH    = '/setup'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths (login page, approval token pages, api routes)
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith(SETUP_PATH) ||
    PUBLIC_PATHS.some(p => pathname.startsWith(p))
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Managers (only) must set their Slack User ID before accessing the app
  // Admins manage the system and do not approve content — no Slack required
  const role = user.user_metadata?.role ?? 'publisher'
  if (role === 'manager') {
    // Check user_settings for slack_user_id
    const { data: settings } = await supabase
      .from('user_settings')
      .select('slack_user_id')
      .eq('user_id', user.id)
      .single()

    const hasSlack = !!(settings?.slack_user_id)
    if (!hasSlack && pathname !== SETUP_PATH) {
      return NextResponse.redirect(new URL(SETUP_PATH, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
