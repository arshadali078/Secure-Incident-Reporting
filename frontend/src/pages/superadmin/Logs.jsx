import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { listLogs } from '@/services/superadmin'

export default function AuditLogsPage() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [userRole, setUserRole] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const params = useMemo(() => {
        const p = {}
        if (userRole) p.userRole = userRole
        if (dateFrom) p.from = dateFrom
        if (dateTo) p.to = dateTo
        return p
    }, [userRole, dateFrom, dateTo])

    const refresh = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await listLogs(params)
            setItems(res.items || [])
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to load logs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params])

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return 'bg-purple-100 text-purple-800'
            case 'ADMIN':
                return 'bg-blue-100 text-blue-800'
            case 'USER':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Audit Logs</CardTitle>
                    <CardDescription>Track who created/updated/deleted incidents and users</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <select
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                            value={userRole}
                            onChange={(e) => setUserRole(e.target.value)}
                        >
                            <option value="">All User Types</option>
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            placeholder="Date From"
                        />
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            placeholder="Date To"
                        />
                    </div>

                    {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}
                    {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

                    {!loading && !error ? (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full border border-slate-200 bg-white text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-slate-700">Time</th>
                                        <th className="px-3 py-2 text-left font-medium text-slate-700">Action</th>
                                        <th className="px-3 py-2 text-left font-medium text-slate-700">Entity</th>
                                        <th className="px-3 py-2 text-left font-medium text-slate-700">By</th>
                                        <th className="px-3 py-2 text-left font-medium text-slate-700">IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-6 text-center text-slate-600">No logs found.</td>
                                        </tr>
                                    ) : (
                                        items.map((l) => (
                                            <tr key={l._id} className="border-t border-slate-200">
                                                <td className="px-3 py-2 text-slate-700">{new Date(l.createdAt).toLocaleString()}</td>
                                                <td className="px-3 py-2 text-slate-900">{l.action}</td>
                                                <td className="px-3 py-2 text-slate-700">{l.entity}</td>
                                                <td className="px-3 py-2 text-slate-700">
                                                    {l.performedBy?.email ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(l.performedBy?.role)}`}>
                                                                {l.performedBy?.role || 'N/A'}
                                                            </span>
                                                            <span>{l.performedBy.email}</span>
                                                        </div>
                                                    ) : (
                                                        l.performedBy || '-'
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-slate-700">{l.ipAddress}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
