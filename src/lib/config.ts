export function getBaseUrl(): string {
    // In the browser, use the current window location
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // On the server (runtime)
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('${{')) {
        return process.env.NEXTAUTH_URL;
    }

    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }

    // Safe fallback for build time (relative URL)
    // Fetches will be made from the client mostly, or if server-side, 
    // they need an absolute URL but we default to empty to avoid "Invalid URL" on build.
    return '';
}
