import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Fix NEXTAUTH_URL for Railway environments
const getAuthUrl = () => {
    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    return 'http://localhost:3000';
};

process.env.NEXTAUTH_URL = getAuthUrl();

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
