export function getBaseUrl(): string {
    // In the browser, use the current window location
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // On the server (runtime) - strict check for valid domain
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('${{')) {
        return process.env.NEXTAUTH_URL;
    }

    // Check Railway domain strictly
    if (process.env.RAILWAY_PUBLIC_DOMAIN && process.env.RAILWAY_PUBLIC_DOMAIN.trim() !== '') {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }

    // Safe fallback for build time - localhost
    // This allows fetch to form a valid URL (http://localhost:3000/api/...) rather than failing on relative URL or empty string.
    // The fetch might fail with connection refused locally/on-build, but that's better than Invalid URL, and catch blocks will handle it.
    return 'http://localhost:3000';
}
