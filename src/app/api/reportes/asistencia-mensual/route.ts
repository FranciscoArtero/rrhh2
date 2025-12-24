
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, getDaysInMonth, getDate } from 'date-fns';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes'); // 1-12
    const anio = searchParams.get('anio'); // 2024

    if (!mes || !anio) return NextResponse.json({ error: 'Mes y año requeridos' }, { status: 400 });

    try {
        const date = new Date(Number(anio), Number(mes) - 1, 1);
        const startDate = startOfMonth(date);
        const endDate = endOfMonth(date);
        const daysInMonth = getDaysInMonth(date);

        // Get all active employees
        const employees = await prisma.empleada.findMany({
            where: { activa: true },
            orderBy: { apellido: 'asc' }
        });

        // Get punches for the month
        const punches = await prisma.registroFichaje.findMany({
            where: {
                timestamp: { gte: startDate, lte: endDate }
            }
        });

        // Build grid
        // Rows: Employees
        // Cols: Days (1..daysInMonth)
        // Cell: ACTIVE (green) / ABSENT (red) / WEEKEND (gray)

        const report = employees.map(emp => {
            const empPunches = punches.filter(p => p.idEmpleada === emp.id);
            const daysData = Array(daysInMonth).fill(null).map((_, i) => {
                const dayNum = i + 1;
                const currentDayDate = new Date(Number(anio), Number(mes) - 1, dayNum);
                const dayOfWeek = currentDayDate.getDay(); // 0 Sun, 6 Sat

                const worked = empPunches.some(p => getDate(p.timestamp) === dayNum);

                let status = 'ABSENT';
                if (worked) status = 'PRESENT';
                else if (dayOfWeek === 0 || dayOfWeek === 6) status = 'WEEKEND';

                return { day: dayNum, status };
            });

            const presentCount = daysData.filter(d => d.status === 'PRESENT').length;

            return {
                id: emp.id,
                nombre: `${emp.apellido}, ${emp.nombre}`,
                asistencia: daysData,
                resumen: {
                    presentes: presentCount,
                    ausentes: daysInMonth - presentCount, // simplistic (includes weekends as absent if not filtered differently)
                    porcentaje: Math.round((presentCount / daysInMonth) * 100)
                }
            };
        });

        return NextResponse.json(report);

    } catch (e) {
        return NextResponse.json({ error: 'Error generating report' }, { status: 500 });
    }
}
