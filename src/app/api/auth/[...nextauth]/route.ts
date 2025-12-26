import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// DEBUG: Log actual NEXTAUTH_URL value to diagnose "Invalid URL" error
console.log('[NextAuth Route] NEXTAUTH_URL:', JSON.stringify(process.env.NEXTAUTH_URL))
console.log('[NextAuth Route] NEXTAUTH_URL length:', process.env.NEXTAUTH_URL?.length)
console.log('[NextAuth Route] RAILWAY_PUBLIC_DOMAIN:', JSON.stringify(process.env.RAILWAY_PUBLIC_DOMAIN))

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
