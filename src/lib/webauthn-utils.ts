
/**
 * Helper to get RP ID and Origin from Request
 */
export const getRpIdAndOrigin = (req: Request) => {
    const host = req.headers.get('host') || 'localhost:3000';

    // RP ID shouldn't have port
    const rpID = host.split(':')[0]; // "localhost" or "example.ngrok.app"

    // Origin usually implies protocol
    // Default to http for localhost, https for others if not determinable, 
    // but better to rely on what browser sent or configured env.
    // However, verifyRegistrationResponse needs expectedOrigin.
    // If we are behind a proxy (ngrok), it's likely https.

    let origin = process.env.NEXT_PUBLIC_ORIGIN;
    if (!origin) {
        const protocol = host.includes('localhost') ? 'http' : 'https';
        origin = `${protocol}://${host}`;
    }

    // If we want to be dynamic:
    // origin = req.headers.get('origin') || origin; 
    // But checking against 'origin' header is part of security. 
    // We should probably trust the environment or match the host.

    return { rpID, origin };
};
