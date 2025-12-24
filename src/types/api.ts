export type ApiResponse<T = any> = {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export type PaginatedResponse<T> = ApiResponse<T[]> & {
    page: number
    totalPages: number
}
