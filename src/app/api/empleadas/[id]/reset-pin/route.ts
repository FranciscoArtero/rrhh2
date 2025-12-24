import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePIN, hashPIN } from '@/lib/utils/pin'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await params
        const newPin = generatePIN()
        const hashedPin = await hashPIN(newPin)

        await prisma.empleada.update({
            where: { id },
            data: { pin: hashedPin }
        })

        return NextResponse.json({ success: true, data: { newPin } })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error resetting PIN' }, { status: 500 })
    }
}
