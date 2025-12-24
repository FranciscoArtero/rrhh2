import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { getRpIdAndOrigin } from '@/lib/webauthn-utils'
import type { AuthenticationResponseJSON } from '@simplewebauthn/types'

export async function POST(req: Request) {
    try {
        const { rpID, origin } = getRpIdAndOrigin(req)
        const { empleadoId, credential } = await req.json()

        // Get challenge
        const challengeDb = await prisma.webAuthnChallenge.findFirst({
            where: {
                empleadoId,
                tipo: 'AUTENTICACION',
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!challengeDb) {
            return NextResponse.json({ error: 'Challenge invalido' }, { status: 400 })
        }

        // Find device by credential ID
        const dispositivo = await prisma.dispositivoAutorizado.findFirst({
            where: {
                webauthnCredentialId: credential.id, // ID from browser is base64url usually
                idEmpleada: empleadoId
            }
        })

        if (!dispositivo || !dispositivo.webauthnPublicKey) {
            return NextResponse.json({ error: 'Dispositivo no encontrado' }, { status: 404 })
        }

        const verification = await verifyAuthenticationResponse({
            response: credential as AuthenticationResponseJSON,
            expectedChallenge: challengeDb.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
                id: dispositivo.webauthnCredentialId!,
                publicKey: new Uint8Array(Buffer.from(dispositivo.webauthnPublicKey!, 'base64url')), // v13 expects Uint8Array
                counter: Number(dispositivo.webauthnCounter),
            },
        })

        if (verification.verified) {
            const { newCounter } = verification.authenticationInfo

            // Update counter and usage
            await prisma.dispositivoAutorizado.update({
                where: { id: dispositivo.id },
                data: {
                    webauthnCounter: BigInt(newCounter),
                    ultimoUso: new Date()
                }
            })

            await prisma.webAuthnChallenge.delete({ where: { id: challengeDb.id } })

            return NextResponse.json({
                success: true,
                dispositivo: {
                    ...dispositivo,
                    webauthnCounter: dispositivo.webauthnCounter.toString()
                }
            })
        }

        return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
    } catch (error: any) {
        console.error('WebAuthn Auth Verify Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
