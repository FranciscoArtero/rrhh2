export function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    // SERVER SIDE:
    // We return empty string by default to prevent "Invalid URL" errors from malformed env vars.
    // If you need absolute URL on server, use a hardcoded value or ensure env var is perfect.
    // Given the issues, we avoid process.env.NEXTAUTH_URL for now.
    return '';
}
