import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePIN, hashPIN } from '@/lib/utils/pin'

const employeeSchema = z.object({
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    dni: z.string().min(1),
    email: z.string().email(),
    telefono: z.string().optional(),
})

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const employees = await prisma.empleada.findMany({
            where: { activa: true },
            orderBy: { nombre: 'asc' }
        })
        return NextResponse.json({ success: true, data: employees })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error fetching employees' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const data = employeeSchema.parse(body)

        // Generate valid PIN
        const plainPin = generatePIN()
        const hashedPin = await hashPIN(plainPin)

        const employee = await prisma.empleada.create({
            data: {
                ...data,
                pin: hashedPin,
                activa: true
            }
        })

        // Return the plain PIN once so admin can give it to employee
        return NextResponse.json({
            success: true,
            data: { ...employee, generatedPin: plainPin }
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false, error: 'Error creating employee' }, { status: 400 })
    }
}
