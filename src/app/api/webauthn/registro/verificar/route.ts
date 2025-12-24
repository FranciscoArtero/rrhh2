import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { getRpIdAndOrigin } from '@/lib/webauthn-utils'
import type { RegistrationResponseJSON } from '@simplewebauthn/types'

export async function POST(req: Request) {
    try {
        const { rpID, origin } = getRpIdAndOrigin(req)
        const { empleadoId, credential, nombreDispositivo, deviceFingerprint } = await req.json()

        if (!empleadoId || !credential) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
        }

        // Find latest challenge
        const challengeDb = await prisma.webAuthnChallenge.findFirst({
            where: {
                empleadoId,
                tipo: 'REGISTRO',
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!challengeDb) {
            return NextResponse.json({ error: 'Challenge expirado o no encontrado' }, { status: 400 })
        }

        const verification = await verifyRegistrationResponse({
            response: credential as RegistrationResponseJSON,
            expectedChallenge: challengeDb.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        })

        if (verification.verified && verification.registrationInfo) {
            const { credential } = verification.registrationInfo
            // credential contains: { id, publicKey, counter, transports? }

            // Save new authenticator
            await prisma.dispositivoAutorizado.create({
                data: {
                    idEmpleada: empleadoId,
                    nombre: nombreDispositivo || 'Dispositivo WebAuthn',
                    deviceFingerprint: deviceFingerprint || 'webauthn-registered',
                    webauthnCredentialId: credential.id,
                    webauthnPublicKey: Buffer.from(credential.publicKey).toString('base64url'),
                    webauthnCounter: BigInt(credential.counter),
                    activo: true,
                    ultimoUso: new Date()
                }
            })

            // Clean used challenge
            await prisma.webAuthnChallenge.delete({ where: { id: challengeDb.id } })

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Verificación fallida' }, { status: 400 })
    } catch (error: any) {
        console.error('WebAuthn Reg Verify Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
