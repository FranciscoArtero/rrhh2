
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, subDays, startOfWeek, endOfDay } from 'date-fns';
import { calcularHorasTrabajadas } from '@/lib/calculos';

/* 
  Dashboard Stats API 
  Returns:
  - activeEmployees: count
  - activeLocales: count
  - todayPunches: count of entries today
  - workingNow: list of employees with entry but no exit today
  - weeklyHours: total hours worked this week by all
  - recentPunches: last 10 records
  - weeklyChart: array of { date, punches } for last 7 days
*/

export async function GET() {
    try {
        const todayStart = startOfDay(new Date());
        const weekStart = subDays(todayStart, 7);

        // 1. Basic Counts
        const activeEmployees = await prisma.empleada.count({ where: { activa: true } });
        const activeLocales = await prisma.local.count({ where: { activo: true } });

        const todayPunchesCount = await prisma.registroFichaje.count({
            where: { timestamp: { gte: todayStart } }
        });

        // 2. Working Now (Complex query: Last punch is ENTRY)
        // We get all employees and check their last status. 
        // Optimized: fetching all employees + their last punch is okay for reasonable size.
        const employees = await prisma.empleada.findMany({
            where: { activa: true },
            include: {
                registros: {
                    take: 1,
                    orderBy: { timestamp: 'desc' },
                    include: { local: true }
                }
            }
        });

        const workingNow = employees
            .filter(e => e.registros.length > 0 && e.registros[0].tipo === 'ENTRADA' && e.registros[0].timestamp >= todayStart) // Only consider "Working Now" if entry was TODAY (prevents old open sessions from looking active forever, optionally remove today check if shifts span days)
            .map(e => ({
                id: e.id,
                nombre: `${e.nombre} ${e.apellido}`,
                local: e.registros[0].local?.nombre || 'Desconocido',
                horaEntrada: e.registros[0].timestamp
            }));

        // 3. Weekly Stats (Chart)
        const weeklyPunches = await prisma.registroFichaje.findMany({
            where: { timestamp: { gte: weekStart } },
            select: { timestamp: true }
        });

        // Group by day
        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const d = subDays(todayStart, 6 - i); // -6 to 0 (today)
            const dayStart = startOfDay(d);
            const dayEnd = endOfDay(d);
            const count = weeklyPunches.filter(p => p.timestamp >= dayStart && p.timestamp <= dayEnd).length;

            chartData.push({
                name: d.toLocaleDateString('es-AR', { weekday: 'short' }), // "lun", "mar"
                fichajes: count,
                fullDate: d.toISOString()
            });
        }

        // 4. Total Hours This Week (Aggregation)
        // Need pairs of Entry/Exit. 
        // Strategy: Get all records from weekStart, sort by employee & time, pair them up.
        const weekRecords = await prisma.registroFichaje.findMany({
            where: { timestamp: { gte: startOfWeek(new Date(), { weekStartsOn: 1 }) } }, // Actual calendar week (Monday)
            orderBy: { timestamp: 'asc' }
        });

        let totalWeeklyHours = 0;
        const employeeRecords: Record<string, any[]> = {};

        // Group by Employee
        weekRecords.forEach(r => {
            if (!employeeRecords[r.idEmpleada]) employeeRecords[r.idEmpleada] = [];
            employeeRecords[r.idEmpleada].push(r);
        });

        // Calculate pairs
        Object.values(employeeRecords).forEach(recs => {
            for (let i = 0; i < recs.length - 1; i++) {
                if (recs[i].tipo === 'ENTRADA' && recs[i + 1].tipo === 'SALIDA') {
                    totalWeeklyHours += calcularHorasTrabajadas(recs[i].timestamp, recs[i + 1].timestamp);
                }
            }
        });

        const avgHoursPerEmployee = activeEmployees > 0 ? (totalWeeklyHours / activeEmployees) : 0;

        // 5. Recent Punches
        const recentPunches = await prisma.registroFichaje.findMany({
            take: 10,
            orderBy: { timestamp: 'desc' },
            include: { empleada: true, local: true }
        });

        const recentFormatted = recentPunches.map(p => ({
            id: p.id,
            empleado: `${p.empleada.nombre} ${p.empleada.apellido}`,
            local: p.local?.nombre || '-',
            tipo: p.tipo,
            hora: p.timestamp,
            metodo: p.metodoVerificacion
        }));

        return NextResponse.json({
            activeEmployees,
            activeLocales,
            todayPunches: todayPunchesCount,
            workingNow,
            totalWeeklyHours: Math.round(totalWeeklyHours * 10) / 10,
            avgHoursPerEmployee: Math.round(avgHoursPerEmployee * 10) / 10,
            weeklyChart: chartData,
            recentPunches: recentFormatted
        });

    } catch (e) {
        console.error('SERVER ERROR in /api/reportes/estadisticas-dashboard');
        console.error(e);
        return NextResponse.json({ error: 'Error fetching stats', details: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined }, { status: 500 });
    }
}
