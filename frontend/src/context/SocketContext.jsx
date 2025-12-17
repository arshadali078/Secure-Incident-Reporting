import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createSocket } from '@/services/socket'
import { useAuth } from '@/context/AuthContext'
import { getAccessToken } from '@/services/api'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
    const { user } = useAuth()
    const [socket, setSocket] = useState(null)

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect()
                setSocket(null)
            }
            return
        }

        const token = getAccessToken()
        const s = createSocket({ token })

        s.on('connect', () => {
            // join per-user room for personal notifications
            s.emit('joinRoom', `user_${user.id}`)
            // join admin room if user is admin or super admin
            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
                s.emit('joinRoom', 'admin')
            }
            // join super admin room if user is super admin
            if (user.role === 'SUPER_ADMIN') {
                s.emit('joinRoom', 'superadmin')
            }
        })

        setSocket(s)

        return () => {
            s.disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])

    const value = useMemo(() => ({ socket }), [socket])

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
    return useContext(SocketContext)
}
