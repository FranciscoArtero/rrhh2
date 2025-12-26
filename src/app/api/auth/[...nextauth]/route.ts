import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Note: NEXTAUTH_URL sanitization is handled in src/instrumentation.ts
// which runs before any other code

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
