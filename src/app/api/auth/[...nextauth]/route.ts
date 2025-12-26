import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// NextAuth reads NEXTAUTH_URL from process.env automatically.
// No manual URL configuration is needed here.

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
