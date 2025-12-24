const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';

/**
 * Returns a valid base URL or null if not configured/invalid.
 * Handles cases where env var is just "https://" or empty.
 */
function getApiBaseUrl(): string | null {
    const base = RAW_API_BASE_URL.trim();

    // Treat empty string or protocol-only as "not configured"
    if (!base || base === 'https://' || base === 'http://') {
        // In browser, we can default to origin (relative path support)
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        // On server, if no valid base, we return null to avoid invalid URL construction
        return null;
    }

    return base;
}

/**
 * Safely builds an API URL.
 * Returns null if base URL is missing/invalid on server.
 * On client, allows relative paths if no base is set.
 */
export function buildApiUrl(path: string): string | null {
    const base = getApiBaseUrl();

    // If we have a valid base, use it
    if (base) {
        try {
            return new URL(path, base).toString();
        } catch (e) {
            console.error('Failed to construct URL:', path, base);
            return null;
        }
    }

    // If no base (and on server), we can't build a valid absolute URL for fetch
    if (typeof window === 'undefined') {
        return null;
    }

    // On client, return relative path
    return path;
}
