import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import NotificationBell from '@/components/NotificationBell'

export default function AppLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="font-semibold text-slate-900">Secure Incident Reporting</div>
                        <div className="text-xs text-slate-600">{user?.role}</div>
                    </div>

                    <nav className="flex items-center gap-2">
                        {user?.role === 'USER' && (
                            <>
                                <Link to="/user" className="text-sm text-slate-700 hover:text-slate-900">My Incidents</Link>
                                <Link to="/user/new" className="text-sm text-slate-700 hover:text-slate-900">New Incident</Link>
                            </>
                        )}
                        {user?.role === 'ADMIN' && (
                            <Link to="/admin" className="text-sm text-slate-700 hover:text-slate-900">Admin Dashboard</Link>
                        )}
                        {user?.role === 'SUPER_ADMIN' && (
                            <>
                                <Link to="/superadmin" className="text-sm text-slate-700 hover:text-slate-900">Super Admin</Link>
                                <Link to="/superadmin/users" className="text-sm text-slate-700 hover:text-slate-900">Users</Link>
                                <Link to="/superadmin/logs" className="text-sm text-slate-700 hover:text-slate-900">Audit Logs</Link>
                            </>
                        )}
                        <NotificationBell />
                        <Button variant="outline" size="sm" onClick={onLogout}>Logout</Button>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6">
                <Outlet />
            </main>
        </div>
    )
}
