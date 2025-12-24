
import { differenceInMinutes, setHours, setMinutes, isAfter, isBefore } from 'date-fns';

const HORAS_NORMALES_DIA = 6;
const HORA_INICIO_NOCTURNA = 21; // 21:00

export function calcularHorasTrabajadas(entrada: Date, salida: Date): number {
    const diffMinutes = differenceInMinutes(salida, entrada);
    // Return hours with 2 decimals
    return Math.round((diffMinutes / 60) * 100) / 100;
}

export function calcularDetalleHoras(entrada: Date, salida: Date) {
    // 1. Calculate Total
    const totalMinutos = differenceInMinutes(salida, entrada);
    const totalHoras = Math.round((totalMinutos / 60) * 100) / 100;

    // 2. Define Night Start (21:00 of the entry day)
    const nightStart = setMinutes(setHours(new Date(entrada), HORA_INICIO_NOCTURNA), 0);

    let minutesDay = 0;
    let minutesNight = 0;

    // Split time into Day (< 21:00) and Night (>= 21:00)
    if (isAfter(entrada, nightStart)) {
        // Entire shift is after 21:00
        minutesNight = totalMinutos;
    } else if (isBefore(salida, nightStart)) {
        // Entire shift is before 21:00
        minutesDay = totalMinutos;
    } else {
        // Shift crosses 21:00
        minutesDay = differenceInMinutes(nightStart, entrada);
        minutesNight = differenceInMinutes(salida, nightStart);
    }

    // 3. Apply 6h rule ONLY to Day minutes
    const limitNormalMinutos = HORAS_NORMALES_DIA * 60;
    let normalMinutos = 0;
    let extraMinutos = 0;

    if (minutesDay > limitNormalMinutos) {
        normalMinutos = limitNormalMinutos;
        extraMinutos = minutesDay - limitNormalMinutos;
    } else {
        normalMinutos = minutesDay;
        extraMinutos = 0;
    }

    return {
        total: totalHoras,
        normal: Math.round((normalMinutos / 60) * 100) / 100,
        extra: Math.round((extraMinutos / 60) * 100) / 100,
        nocturna: Math.round((minutesNight / 60) * 100) / 100
    };
}

export function calcularHorasNormales(entrada: Date, salida: Date): number {
    return calcularDetalleHoras(entrada, salida).normal;
}

export function calcularHorasExtra(entrada: Date, salida: Date): number {
    return calcularDetalleHoras(entrada, salida).extra;
}

export function calcularHorasExtraNocturnas(entrada: Date, salida: Date): number {
    return calcularDetalleHoras(entrada, salida).nocturna;
}

export function esDiaLaboral(fecha: Date): boolean {
    const day = fecha.getDay();
    // 0 is Sunday, 6 is Saturday
    return day !== 0 && day !== 6;
}

export function formatearHoras(decimalHours: number): string {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
}

export function downloadCSV(data: any[], headers: string[], filename: string) {
    if (!data || !data.length) return;

    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            Object.values(row).map(value =>
                typeof value === 'string' ? `"${value}"` : value
            ).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
