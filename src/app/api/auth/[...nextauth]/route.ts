import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Fix NEXTAUTH_URL for Railway environments
if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.length < 10) {
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        process.env.NEXTAUTH_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
