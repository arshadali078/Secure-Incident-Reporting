import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setAccessToken } from '@/services/api'

const AuthContext = createContext(null)

function decodeJwtPayload(token) {
    try {
        const payload = token.split('.')[1]
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        const json = decodeURIComponent(
            atob(normalized)
                .split('')
                .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join('')
        )
        return JSON.parse(json)
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const applyAccessToken = useCallback((token, userFromResponse) => {
        setAccessToken(token)

        if (userFromResponse) {
            setUser(userFromResponse)
            return
        }

        const payload = decodeJwtPayload(token)
        if (payload?.id && payload?.role) {
            setUser({ id: payload.id, role: payload.role })
        } else {
            setUser(null)
        }
    }, [])

    const refreshSession = useCallback(async () => {
        const res = await api.post('/auth/refresh')
        const token = res?.data?.accessToken
        if (!token) throw new Error('No accessToken from refresh')
        applyAccessToken(token)
        return token
    }, [applyAccessToken])

    const login = useCallback(
        async ({ email, password }) => {
            const res = await api.post('/auth/login', { email, password })
            const token = res?.data?.accessToken
            const u = res?.data?.user
            if (!token || !u) throw new Error('Invalid login response')
            applyAccessToken(token, u)
            return u
        },
        [applyAccessToken]
    )

    const register = useCallback(
        async ({ name, email, password }) => {
            const res = await api.post('/auth/register', { name, email, password })
            const token = res?.data?.accessToken
            const u = res?.data?.user
            if (!token || !u) throw new Error('Invalid register response')
            applyAccessToken(token, u)
            return u
        },
        [applyAccessToken]
    )

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout')
        } finally {
            setAccessToken(null)
            setUser(null)
        }
    }, [])

    useEffect(() => {
        let active = true

            ; (async () => {
                try {
                    await refreshSession()
                } catch {
                    // not logged in
                } finally {
                    if (active) setLoading(false)
                }
            })()

        return () => {
            active = false
        }
    }, [refreshSession])

    const value = useMemo(
        () => ({ user, loading, login, register, logout, refreshSession }),
        [user, loading, login, register, logout, refreshSession]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
