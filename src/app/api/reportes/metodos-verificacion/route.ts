
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const desde = searchParams.get('fechaDesde');
    const hasta = searchParams.get('fechaHasta');

    try {
        const whereClause: any = {};
        if (desde && hasta) {
            whereClause.timestamp = {
                gte: startOfDay(new Date(desde)),
                lte: endOfDay(new Date(hasta))
            };
        }

        // Aggregate by method
        // Prisma doesn't support easy GROUP BY count in filtered query object well for Enums in all versions, 
        // but let's try groupBy first.
        const stats = await prisma.registroFichaje.groupBy({
            by: ['metodoVerificacion'],
            where: whereClause,
            _count: {
                metodoVerificacion: true
            }
        });

        // Format for Recharts (name, value)
        const formatLabel = (key: string) => {
            const map: Record<string, string> = {
                'WEBAUTHN_HUELLA': 'Huella Digital',
                'WEBAUTHN_FACE': 'Face ID (Nativo)',
                'RECONOCIMIENTO_FACIAL': 'Reconocimiento Facial (IA)',
                'PIN_EMERGENCIA': 'PIN',
                'NINGUNO': 'Ninguno'
            };
            return map[key] || key;
        };

        const data = stats.map(s => ({
            name: formatLabel(s.metodoVerificacion),
            value: s._count.metodoVerificacion
        })).filter(s => s.value > 0);

        return NextResponse.json(data);

    } catch (e) {
        return NextResponse.json({ error: 'Error generating report' }, { status: 500 });
    }
}
