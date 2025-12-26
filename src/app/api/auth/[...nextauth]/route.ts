import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// DEFENSIVE FIX: Ensure NEXTAUTH_URL is valid before NextAuth initializes
// This fixes "TypeError: Invalid URL - input: 'https://'" errors
function ensureValidNextAuthUrl(): void {
    const currentUrl = process.env.NEXTAUTH_URL || ''

    // Log for debugging
    console.log('[NextAuth] Current NEXTAUTH_URL:', JSON.stringify(currentUrl), 'length:', currentUrl.length)
    console.log('[NextAuth] RAILWAY_PUBLIC_DOMAIN:', JSON.stringify(process.env.RAILWAY_PUBLIC_DOMAIN))

    // Check if URL is valid (has protocol and hostname)
    const isValidUrl = (url: string): boolean => {
        try {
            const parsed = new URL(url)
            return !!parsed.hostname && parsed.hostname.length > 0
        } catch {
            return false
        }
    }

    if (!isValidUrl(currentUrl)) {
        console.warn('[NextAuth] NEXTAUTH_URL is invalid or missing, attempting to fix...')

        // Try to construct from RAILWAY_PUBLIC_DOMAIN
        const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN
        if (railwayDomain && railwayDomain.length > 0) {
            const fixedUrl = `https://${railwayDomain}`
            console.log('[NextAuth] Reconstructing URL from RAILWAY_PUBLIC_DOMAIN:', fixedUrl)
            process.env.NEXTAUTH_URL = fixedUrl
        } else {
            // Last resort: use localhost
            console.warn('[NextAuth] No valid domain found, using localhost')
            process.env.NEXTAUTH_URL = 'http://localhost:3000'
        }
    }

    console.log('[NextAuth] Final NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
}

// Run validation before NextAuth initializes
ensureValidNextAuthUrl()

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
