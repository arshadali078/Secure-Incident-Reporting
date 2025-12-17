import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listIncidents } from '@/services/incidents'
import { hardDeleteIncident } from '@/services/superadmin'
import { useSocket } from '@/context/SocketContext'
import EvidenceViewer from '@/components/EvidenceViewer'

export default function SuperAdminDashboard() {
    const { socket } = useSocket() || {}
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [notice, setNotice] = useState('')

    const params = useMemo(() => {
        const p = { sort: '-createdAt' }
        if (search.trim()) p.search = search.trim()
        return p
    }, [search])

    const refresh = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await listIncidents(params)
            setItems(res.items || [])
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to load incidents')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params])

    useEffect(() => {
        if (!socket) return

        const onNew = (data) => {
            setNotice(`New incident reported: "${data.title}"`)
            refresh()
            window.setTimeout(() => setNotice(''), 5000)
        }

        const onUpdate = (data) => {
            const actionMessages = {
                'UPDATE': `Incident "${data.title}" has been updated`,
                'RESOLVE': `Incident "${data.title}" has been resolved`,
                'INPROGRESS': `Incident "${data.title}" is now in progress`,
                'OPEN': `Incident "${data.title}" has been reopened`,
                'CLOSE': `Incident "${data.title}" has been closed`,
            }
            setNotice(actionMessages[data.action] || `Incident "${data.title}" has been updated`)
            refresh()
            window.setTimeout(() => setNotice(''), 5000)
        }

        const onDelete = (data) => {
            setNotice(`Incident "${data.title}" has been deleted`)
            refresh()
            window.setTimeout(() => setNotice(''), 5000)
        }

        const onBulkResolve = (data) => {
            setNotice(`${data.count} incident(s) have been resolved`)
            refresh()
            window.setTimeout(() => setNotice(''), 5000)
        }

        socket.on('incident:new', onNew)
        socket.on('incident:update', onUpdate)
        socket.on('incident:delete', onDelete)
        socket.on('incident:bulk-resolve', onBulkResolve)

        return () => {
            socket.off('incident:new', onNew)
            socket.off('incident:update', onUpdate)
            socket.off('incident:delete', onDelete)
            socket.off('incident:bulk-resolve', onBulkResolve)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket])

    const onDelete = async (id) => {
        await hardDeleteIncident(id)
        refresh()
    }

    return (
        <div className="grid gap-4">
            {notice ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    {notice}
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Super Admin</CardTitle>
                        <CardDescription>Full control over users, logs, and incident deletion</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline"><Link to="/superadmin/users">Manage Users</Link></Button>
                            <Button asChild variant="outline"><Link to="/superadmin/logs">View Audit Logs</Link></Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hard Delete Incidents</CardTitle>
                        <CardDescription>Permanently delete incidents (no soft delete)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents…" />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Incidents</CardTitle>
                    <CardDescription>Delete only when required (permanent)</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="text-sm text-slate-600">Loading…</div> : null}
                    {error ? <div className="text-sm text-red-600">{error}</div> : null}

                    {!loading && !error ? (
                        <div className="overflow-x-auto -mx-4 px-4">
                            <div className="block md:hidden">
                                {items.length === 0 ? (
                                    <div className="text-center py-6 text-slate-600">No incidents found.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map((it) => (
                                            <div key={it._id} className="border border-slate-200 rounded-lg p-4 bg-white">
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-xs text-slate-500">Title:</span>
                                                        <p className="font-medium text-slate-900">{it.title}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-slate-500">User:</span>
                                                        <p className="text-slate-700">{it.createdBy?.email || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-slate-500">Status:</span>
                                                        <p className="text-slate-700">{it.status}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-slate-500">Evidence:</span>
                                                        <div className="mt-1">
                                                            <EvidenceViewer evidenceFiles={it.evidenceFiles} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-slate-500">Created:</span>
                                                        <p className="text-slate-700">{new Date(it.createdAt).toLocaleString()}</p>
                                                    </div>
                                                    <div className="pt-2">
                                                        <Button variant="destructive" size="sm" onClick={() => onDelete(it._id)} className="w-full">Delete</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="hidden md:block">
                                <table className="min-w-full border border-slate-200 bg-white text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Title</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">User</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Evidence</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Created</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-3 py-6 text-center text-slate-600">No incidents found.</td>
                                            </tr>
                                        ) : (
                                            items.map((it) => (
                                                <tr key={it._id} className="border-t border-slate-200">
                                                    <td className="px-3 py-2 text-slate-900">{it.title}</td>
                                                    <td className="px-3 py-2 text-slate-700">{it.createdBy?.email || '-'}</td>
                                                    <td className="px-3 py-2 text-slate-700">{it.status}</td>
                                                    <td className="px-3 py-2">
                                                        <EvidenceViewer evidenceFiles={it.evidenceFiles} />
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-700">{new Date(it.createdAt).toLocaleString()}</td>
                                                    <td className="px-3 py-2">
                                                        <Button variant="destructive" size="sm" onClick={() => onDelete(it._id)}>Delete</Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
