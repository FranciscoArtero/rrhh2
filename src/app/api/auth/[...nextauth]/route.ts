import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Fix invalid NEXTAUTH_URL before NextAuth reads it
// If NEXTAUTH_URL is malformed (like "https://" without domain), delete it
// so NextAuth infers the URL from request headers instead
const nextAuthUrl = process.env.NEXTAUTH_URL
if (nextAuthUrl) {
    try {
        const url = new URL(nextAuthUrl)
        // URL is valid but has no hostname (like "https://")
        if (!url.hostname) {
            delete process.env.NEXTAUTH_URL
        }
    } catch {
        // URL is completely invalid, delete it
        delete process.env.NEXTAUTH_URL
    }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
