import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyEmployeeToken } from '@/lib/auth'

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname

    // 1. Admin Routes Protection
    if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
        const token = await getToken({ req })
        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', req.url))
        }
    }

    // 2. Employee API Protection (example pattern)
    // If we had pages like /app/..., we would protect them here.
    // For now, let's protect /api/fichajes if it's not checked inside the route.
    // But usually APIs check auth internally to get user context. 
    // Let's just ensure /admin dashboard is protected.

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
    ]
}
