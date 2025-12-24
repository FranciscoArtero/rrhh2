import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import crypto from 'crypto';
import type { AuthenticatorTransport } from '@simplewebauthn/types';

// Types
type LocalAuthenticatorDevice = {
    credentialID: string; // Base64URL
    credentialPublicKey: Uint8Array;
    counter: number;
    transports?: AuthenticatorTransport[];
}

// Configuration
export const RP_NAME = 'Sistema Fichaje RRHH';
// Default fallback if not provided dynamically
export const DEFAULT_RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
export const DEFAULT_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

/**
 * Checks if the browser supports WebAuthn (Client-side helper)
 */


/**
 * Generates a secure random challenge
 */
export const generarChallenge = (): string => {
    return crypto.randomBytes(32).toString('base64url');
};

/**
 * Generates registration options for navigator.credentials.create()
 */
export const generarOpcionesRegistro = async (
    userId: string,
    userName: string,
    devices: LocalAuthenticatorDevice[] = [],
    rpID: string = DEFAULT_RP_ID
) => {
    const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: rpID,
        userID: new Uint8Array(Buffer.from(userId)),
        userName: userName,
        userDisplayName: userName,
        attestationType: 'none',
        excludeCredentials: devices.map(dev => ({
            id: dev.credentialID, // Now string, which matches Base64URLString
            type: 'public-key',
            transports: dev.transports,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'required',
            authenticatorAttachment: 'platform',
        },
    });
    return options;
};

/**
 * Generates authentication options for navigator.credentials.get()
 * @param credentialIds - Array of registered credential IDs for this user
 */
export const generarOpcionesAutenticacion = async (
    credentialIds: string[],
    rpID: string = DEFAULT_RP_ID
) => {
    const options = await generateAuthenticationOptions({
        rpID: rpID,
        allowCredentials: credentialIds.map(id => ({
            id: id,
            type: 'public-key',
            // optional transports
        })),
        userVerification: 'required',
    });
    return options;
};
