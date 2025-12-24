import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generarOpcionesRegistro } from '@/lib/webauthn'
import { getRpIdAndOrigin } from '@/lib/webauthn-utils'

export async function POST(req: Request) {
    try {
        const { empleadoId } = await req.json()
        const { rpID } = getRpIdAndOrigin(req)

        if (!empleadoId) {
            return NextResponse.json({ error: 'Empleado ID requerido' }, { status: 400 })
        }

        const empleado = await prisma.empleada.findUnique({
            where: { id: empleadoId },
            include: { dispositivos: true }
        })

        if (!empleado) {
            return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
        }

        // Get existing device credentials to prevent re-registration
        const existingDevices = empleado.dispositivos
            .filter(d => d.webauthnCredentialId && d.webauthnPublicKey)
            .map(d => ({
                credentialID: d.webauthnCredentialId!, // Pass string directly
                credentialPublicKey: new Uint8Array(Buffer.from(d.webauthnPublicKey!, 'base64url')),
                counter: Number(d.webauthnCounter),
            }))

        const options = await generarOpcionesRegistro(
            empleado.id,
            empleado.email,
            existingDevices,
            rpID
        )

        // Save challenge
        await prisma.webAuthnChallenge.create({
            data: {
                empleadoId: empleado.id,
                challenge: options.challenge,
                tipo: 'REGISTRO',
                expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
            }
        })

        return NextResponse.json(options)
    } catch (error: any) {
        console.error('WebAuthn Reg Options Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
