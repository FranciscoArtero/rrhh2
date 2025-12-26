import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// NEXTAUTH_URL must be set correctly in Railway environment variables.
// No code manipulation needed - NextAuth reads it directly from process.env.

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
