const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const devices = await prisma.dispositivoAutorizado.findMany();
        console.log('--- All Devices ---');
        console.log(devices);

        const employees = await prisma.empleada.findMany({
            include: { dispositivos: true }
        });
        console.log('--- Employees with Devices ---');
        console.log(JSON.stringify(employees, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
