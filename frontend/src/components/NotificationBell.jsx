import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '@/context/NotificationContext'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'INCIDENT_CREATED':
                return '🆕'
            case 'INCIDENT_UPDATED':
                return '✏️'
            case 'INCIDENT_RESOLVED':
                return '✅'
            case 'INCIDENT_IN_PROGRESS':
                return '🔄'
            case 'INCIDENT_REOPENED':
                return '🔓'
            case 'INCIDENT_CLOSED':
                return '🔒'
            case 'INCIDENT_DELETED':
                return '🗑️'
            case 'INCIDENT_ASSIGNED':
                return '👤'
            case 'BULK_RESOLVE':
                return '📋'
            default:
                return '🔔'
        }
    }

    const formatTime = (date) => {
        const now = new Date()
        const notificationDate = new Date(date)
        const diffMs = now - notificationDate
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return notificationDate.toLocaleDateString()
    }

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification._id)
        }
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="relative"
            >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-200 p-3 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs"
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-500">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''
                                            }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-xl">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p
                                                            className={`text-sm font-medium ${!notification.read
                                                                    ? 'text-slate-900'
                                                                    : 'text-slate-700'
                                                                }`}
                                                        >
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-slate-600 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {formatTime(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    deleteNotification(notification._id)
                                                }}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="border-t border-slate-200 p-2 text-center">
                            <Link
                                to={
                                    notifications[0]?.incidentId
                                        ? `/user`
                                        : '/user'
                                }
                                className="text-xs text-blue-600 hover:text-blue-800"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
