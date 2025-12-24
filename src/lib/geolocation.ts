export type Coordinates = {
    lat: number
    lng: number
}

// Earth's radius in meters
const R = 6371e3

export function calculateDistance(
    lat1: number | string | URLSearchParams,
    lng1: number | string,
    lat2: number | string,
    lng2: number | string
): number {
    const la1 = Number(lat1)
    const lo1 = Number(lng1)
    const la2 = Number(lat2)
    const lo2 = Number(lng2)

    const φ1 = (la1 * Math.PI) / 180
    const φ2 = (la2 * Math.PI) / 180
    const Δφ = ((la2 - la1) * Math.PI) / 180
    const Δλ = ((lo2 - lo1) * Math.PI) / 180

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Returns distance in meters
}

export function isWithinRadius(
    userLoc: Coordinates,
    branchLoc: Coordinates,
    radiusMeters: number
): boolean {
    const distance = calculateDistance(
        userLoc.lat,
        userLoc.lng,
        branchLoc.lat,
        branchLoc.lng
    )
    return distance <= radiusMeters
}
