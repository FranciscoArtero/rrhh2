/** @type {import('next').NextConfig} */

// CRITICAL: Sanitize NEXTAUTH_URL BEFORE anything else runs
// This fixes "Invalid URL: https://" error in Railway
const rawNextAuthUrl = process.env.NEXTAUTH_URL || ''
const isInvalidUrl = !rawNextAuthUrl ||
    rawNextAuthUrl === 'https://' ||
    rawNextAuthUrl === 'http://' ||
    rawNextAuthUrl.match(/^https?:\/\/?$/)

if (isInvalidUrl) {
    // Try to construct from Railway's domain
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        process.env.NEXTAUTH_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    } else {
        // Remove invalid URL entirely - NextAuth will infer from request
        delete process.env.NEXTAUTH_URL
    }
}

const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
})

const nextConfig = {
    // Ensure instrumentation runs
    experimental: {
        instrumentationHook: true,
    },
}

module.exports = withPWA(nextConfig)
