import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generarOpcionesAutenticacion } from '@/lib/webauthn'
import { getRpIdAndOrigin } from '@/lib/webauthn-utils'

export async function POST(req: Request) {
    try {
        const { empleadoId } = await req.json()
        const { rpID } = getRpIdAndOrigin(req)

        const empleado = await prisma.empleada.findUnique({
            where: { id: empleadoId },
            include: { dispositivos: { where: { activo: true, webauthnCredentialId: { not: null } } } }
        })

        if (!empleado || empleado.dispositivos.length === 0) {
            return NextResponse.json({ error: 'No se encontraron credenciales registradas' }, { status: 404 })
        }

        const credentialIds = empleado.dispositivos
            .map(d => d.webauthnCredentialId!)
        // .map(id => Buffer.from(id, 'base64url')) // simplewebauthn might expect string or buffer depending on version, usually generates expecting string for client?
        // `generateAuthenticationOptions` allowCredentials.id is string (base64url) in modern simplewebauthn??
        // Checking types: PublicKeyCredentialDescriptorFuture.id is Base64URLString.
        // So passing stored string is fine usually.

        const options = await generarOpcionesAutenticacion(credentialIds, rpID)

        await prisma.webAuthnChallenge.create({
            data: {
                empleadoId: empleado.id,
                challenge: options.challenge,
                tipo: 'AUTENTICACION',
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            }
        })

        return NextResponse.json(options)
    } catch (error: any) {
        console.error('WebAuthn Auth Options Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
