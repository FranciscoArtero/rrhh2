export async function register() {
    // Sanitize NEXTAUTH_URL before any other code runs
    // This fixes the "Invalid URL: https://" error when NEXTAUTH_URL
    // is misconfigured in Railway as just "https://" without a domain
    const url = process.env.NEXTAUTH_URL

    if (url) {
        // Check for malformed URLs
        const isMalformed =
            url === 'https://' ||
            url === 'http://' ||
            url === 'https:' ||
            url === 'http:' ||
            /^https?:\/\/?$/.test(url)

        if (isMalformed) {
            console.warn('[instrumentation] Removing malformed NEXTAUTH_URL:', url)
            delete process.env.NEXTAUTH_URL
        } else {
            // Validate URL can be parsed
            try {
                const parsed = new URL(url)
                if (!parsed.hostname) {
                    console.warn('[instrumentation] NEXTAUTH_URL has no hostname, removing:', url)
                    delete process.env.NEXTAUTH_URL
                }
            } catch (e) {
                console.warn('[instrumentation] NEXTAUTH_URL is invalid, removing:', url)
                delete process.env.NEXTAUTH_URL
            }
        }
    }
}
