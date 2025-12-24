export function getBaseUrl(): string {
    // In the browser, use the current window location
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // On the server (runtime) - strict check for valid domain
    // Must be a valid URL, not just protocol, and not template variable
    if (process.env.NEXTAUTH_URL &&
        !process.env.NEXTAUTH_URL.includes('${{') &&
        process.env.NEXTAUTH_URL.length > 10) {
        return process.env.NEXTAUTH_URL;
    }

    // Default to relative URL (empty string) for maximum safety
    // This relies on the fact that admin pages are "use client" so fetches happen in browser.
    // If a fetch happens in Node environment with empty string base, it will fail with "Invalid URL",
    // but the input will be "/api/...", NOT "https://".
    // If the error was "https://", it came from the Railway logic we just removed.
    return '';
}
