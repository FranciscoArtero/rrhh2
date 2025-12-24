import { useState, useCallback, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// Helper to sanitize Base64URL strings for Safari/older browsers
const cleanBase64 = (str: string) => {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
        case 0:
            break;
        case 2:
            output += '==';
            break;
        case 3:
            output += '=';
            break;
        default:
            // illegal string, but let atob fail if it must
            break;
    }
    return output;
}

const sanitizeOptions = (obj: any): any => {
    // Deep clone to avoid mutating original
    const newObj = JSON.parse(JSON.stringify(obj));

    // 1. Remove nulls (WebIDL doesn't like nulls for optional dictionaries)
    const removeNulls = (o: any): any => {
        if (Array.isArray(o)) {
            return o.map(removeNulls);
        }
        if (typeof o === 'object' && o !== null) {
            Object.keys(o).forEach(key => {
                if (o[key] === null) delete o[key];
                else o[key] = removeNulls(o[key]);
            });
        }
        return o;
    };
    removeNulls(newObj);

    // 2. Target specific Base64 fields to clean
    // challenge is always top level
    if (newObj.challenge && typeof newObj.challenge === 'string') {
        newObj.challenge = cleanBase64(newObj.challenge);
    }

    // user.id for registration
    if (newObj.user && newObj.user.id && typeof newObj.user.id === 'string') {
        newObj.user.id = cleanBase64(newObj.user.id);
    }

    // allowCredentials / excludeCredentials IDs
    const cleanCreds = (list: any[]) => {
        if (!list) return;
        list.forEach(cred => {
            if (cred.id && typeof cred.id === 'string') {
                cred.id = cleanBase64(cred.id);
            }
        });
    };

    if (Array.isArray(newObj.allowCredentials)) cleanCreds(newObj.allowCredentials);
    if (Array.isArray(newObj.excludeCredentials)) cleanCreds(newObj.excludeCredentials);

    return newObj;
}


export const useWebAuthn = () => {
    const [soportado, setSoportado] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Support Check
    useEffect(() => {
        try {
            // Simple check for browser API support
            if (typeof window !== 'undefined' && !!window.PublicKeyCredential) {
                // Safeguard against isUserVerifyingPlatformAuthenticatorAvailable not being a function
                if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
                    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                        .then(available => {
                            setSoportado(available);
                        })
                        .catch((e) => {
                            console.error("Platform auth check failed", e);
                            setSoportado(false);
                        });
                } else {
                    // Fallback if method missing but PublicKeyCredential exists (unlikely but possible)
                    setSoportado(true);
                }
            }
        } catch (e) {
            console.error("Error in support check", e);
            setSoportado(false);
        }
    }, []);

    const verificarSoporte = () => soportado;

    const registrarDispositivo = async (nombreDispositivo: string, empleadoId: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get options from server
            const respOpciones = await fetch('/api/webauthn/registro/opciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empleadoId })
            });
            const opciones = await respOpciones.json();

            if (!respOpciones.ok) throw new Error(opciones.error || 'Error obteniendo opciones');

            // 2. Browser interaction
            // 2. Browser interaction
            // Sanitize options for Safari (remove nulls + fix Base64)
            const cleanOptions = sanitizeOptions(opciones);
            const attResp = await startRegistration(cleanOptions);

            // 3. Verify with server
            const respVerify = await fetch('/api/webauthn/registro/verificar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empleadoId,
                    credential: attResp,
                    nombreDispositivo
                })
            });
            const verification = await respVerify.json();

            if (!respVerify.ok) throw new Error(verification.error || 'Error verificando registro');

            return verification; // { success: true }
        } catch (err: any) {
            console.error(err);
            if (err.name === 'InvalidStateError' || err.message?.includes('previously registered')) {
                setError('Este dispositivo ya está registrado para este usuario.');
            } else {
                setError(err.message || 'Error en el registro biométrico');
            }
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const autenticar = async (empleadoId: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get options
            const respOpciones = await fetch('/api/webauthn/autenticar/opciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empleadoId })
            });
            const opciones = await respOpciones.json();

            if (!respOpciones.ok) throw new Error(opciones.error || 'Error iniciando autenticación');

            // 2. Browser interaction
            let cleanOptions;
            try {
                // Sanitize options for Safari (remove nulls + fix Base64)
                cleanOptions = sanitizeOptions(opciones);
            } catch (cleanErr: any) {
                console.error("Error cleaning options:", cleanErr);
                throw new Error("Error procesando opciones (clean): " + cleanErr.message);
            }

            let asseResp;
            try {
                asseResp = await startAuthentication(cleanOptions);
            } catch (authErr: any) {
                console.error("Error startAuthentication:", authErr);
                // Pass through original if it's NotAllowed, otherwise wrap
                if (authErr.name === 'NotAllowedError') throw authErr;
                throw new Error("Error en startAuthentication: " + authErr.message);
            }

            // 3. Verify
            const respVerify = await fetch('/api/webauthn/autenticar/verificar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empleadoId,
                    credential: asseResp
                })
            });
            const verification = await respVerify.json();

            if (!respVerify.ok) throw new Error(verification.error || 'Error verificando identidad');

            return verification; // { success: true, dispositivo: ... }
        } catch (err: any) {
            console.error(err);
            // Handle specific WebAuthn errors elegantly
            if (err.name === 'NotAllowedError') {
                setError('Operación cancelada o no permitida.');
            } else {
                setError(err.message || 'Error en la autenticación');
            }
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        soportado,
        loading,
        error,
        verificarSoporte,
        registrarDispositivo,
        autenticar
    };
};
