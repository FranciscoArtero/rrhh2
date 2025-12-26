import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

// --- Admin Auth Config (NextAuth) ---
export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/admin/login',
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.usuarioAdmin.findUnique({
                    where: { email: credentials.email },
                })

                if (!user || !user.activo) return null

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                )

                if (!isValid) return null

                return {
                    id: user.id,
                    name: user.nombre,
                    email: user.email,
                    role: user.rol,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role
            }
            return session
        },
    },
    // @ts-expect-error
    trustHost: true,
}

// --- Employee Auth Helper (Custom JWT) ---
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default_jwt_secret_change_me'
)

export async function signEmployeeToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // Long session for employees
        .sign(JWT_SECRET)
}

export async function verifyEmployeeToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload
    } catch (error) {
        return null
    }
}
