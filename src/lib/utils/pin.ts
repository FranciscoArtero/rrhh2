import bcrypt from 'bcryptjs'

export function generatePIN(): string {
    // Generate a random 4-digit PIN
    return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function hashPIN(pin: string): Promise<string> {
    return await bcrypt.hash(pin, 10)
}

export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(pin, hash)
}
