import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '@/services/notifications'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
    const { user } = useAuth()
    const { socket } = useSocket() || {}
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)

    const fetchNotifications = async () => {
        if (!user) return
        setLoading(true)
        try {
            const res = await getNotifications({ limit: 50 })
            setNotifications(res.items || [])
            setUnreadCount(res.unreadCount || 0)
        } catch (err) {
            console.error('Failed to fetch notifications:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchNotifications()
        } else {
            setNotifications([])
            setUnreadCount(0)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])

    useEffect(() => {
        if (!socket || !user) return

        const onNewNotification = (data) => {
            // Add new notification to the list
            const newNotification = {
                _id: Date.now().toString(), // Temporary ID
                type: data.type || 'INCIDENT_UPDATED',
                title: data.title || 'New Notification',
                message: data.message || '',
                incidentId: data.incidentId,
                read: false,
                createdAt: new Date(),
            }
            setNotifications((prev) => [newNotification, ...prev])
            setUnreadCount((prev) => prev + 1)
            // Refresh to get actual notification from DB
            setTimeout(() => fetchNotifications(), 500)
        }

        // Listen for various notification events
        socket.on('incident:new', onNewNotification)
        socket.on('incident:update', onNewNotification)
        socket.on('incident:delete', onNewNotification)
        socket.on('incident:bulk-resolve', onNewNotification)
        socket.on('incident:notification', onNewNotification)

        return () => {
            socket.off('incident:new', onNewNotification)
            socket.off('incident:update', onNewNotification)
            socket.off('incident:delete', onNewNotification)
            socket.off('incident:bulk-resolve', onNewNotification)
            socket.off('incident:notification', onNewNotification)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, user?.id])

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId)
            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === notificationId ? { ...n, read: true, readAt: new Date() } : n
                )
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
        } catch (err) {
            console.error('Failed to mark notification as read:', err)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead()
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read: true, readAt: new Date() }))
            )
            setUnreadCount(0)
        } catch (err) {
            console.error('Failed to mark all as read:', err)
        }
    }

    const handleDelete = async (notificationId) => {
        try {
            await deleteNotification(notificationId)
            setNotifications((prev) => prev.filter((n) => n._id !== notificationId))
            // Update unread count if it was unread
            const notification = notifications.find((n) => n._id === notificationId)
            if (notification && !notification.read) {
                setUnreadCount((prev) => Math.max(0, prev - 1))
            }
        } catch (err) {
            console.error('Failed to delete notification:', err)
        }
    }

    const value = useMemo(
        () => ({
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead: handleMarkAsRead,
            markAllAsRead: handleMarkAllAsRead,
            deleteNotification: handleDelete,
        }),
        [notifications, unreadCount, loading]
    )

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider')
    }
    return context
}
