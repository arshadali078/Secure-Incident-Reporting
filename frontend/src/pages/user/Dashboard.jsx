import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listIncidents } from '@/services/incidents'
import { useSocket } from '@/context/SocketContext'
import EvidenceViewer from '@/components/EvidenceViewer'

const categories = ['All', 'Security Breach', 'Data Leak', 'System Failure', 'Unauthorized Access', 'Malware', 'Phishing', 'Ransomware', 'Other']
const statuses = ['All', 'Open', 'In Progress', 'Resolved', 'Closed']

export default function UserDashboard() {
    const { socket } = useSocket() || {}

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [status, setStatus] = useState('All')
    const [sort, setSort] = useState('-createdAt')

    const [notice, setNotice] = useState('')

    const params = useMemo(() => {
        const p = { sort }
        if (search.trim()) p.search = search.trim()
        if (category !== 'All') p.category = category
        if (status !== 'All') p.status = status
        return p
    }, [search, category, status, sort])

    const fetchData = async () => {
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
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params])

    useEffect(() => {
        if (!socket) return

        const onNotification = (data) => {
            const actionMessages = {
                'ADD': `Incident "${data.title}" has been created`,
                'UPDATE': `Incident "${data.title}" has been updated`,
                'RESOLVE': `Incident "${data.title}" has been resolved`,
                'INPROGRESS': `Incident "${data.title}" is now in progress`,
                'OPEN': `Incident "${data.title}" has been reopened`,
                'CLOSE': `Incident "${data.title}" has been closed`,
                'DELETE': data.message || `Incident "${data.title}" has been deleted`,
            }
            setNotice(actionMessages[data.action] || `Incident "${data.title}" has been updated`)
            fetchData()
            window.setTimeout(() => setNotice(''), 5000)
        }

        const onUpdate = (data) => {
            if (data.action === 'DELETE') {
                setNotice(`Incident has been deleted`)
            } else {
                setNotice(`Incident "${data.title}" has been ${data.action.toLowerCase()}d`)
            }
            fetchData()
            window.setTimeout(() => setNotice(''), 5000)
        }

        socket.on('incident:notification', onNotification)
        socket.on('incident:update', onUpdate)
        socket.on('incident:delete', onUpdate)

        return () => {
            socket.off('incident:notification', onNotification)
            socket.off('incident:update', onUpdate)
            socket.off('incident:delete', onUpdate)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket])

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle>My Incidents</CardTitle>
                            <CardDescription>Search, filter, and track status updates</CardDescription>
                        </div>
                        <Button asChild>
                            <Link to="/user/new">New Incident</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {notice ? (
                        <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            {notice}
                        </div>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title/description…" />
                        </div>

                        <select
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <select
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            {statuses.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="text-xs text-slate-600">
                            Sort by Date
                        </div>
                        <select
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >
                            <option value="-createdAt">Newest First</option>
                            <option value="createdAt">Oldest First</option>
                            <option value="-incidentDate">Most Recent Incident Date</option>
                            <option value="incidentDate">Oldest Incident Date</option>
                        </select>
                    </div>

                    {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}
                    {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

                    {!loading && !error ? (
                        <div className="mt-4 overflow-x-auto -mx-4 px-4">
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
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className="text-xs text-slate-500">Category:</span>
                                                            <p className="text-slate-700">{it.category}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-slate-500">Priority:</span>
                                                            <p className="text-slate-700">{it.priority}</p>
                                                        </div>
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
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className="text-xs text-slate-500">Incident Date:</span>
                                                            <p className="text-slate-700">{it.incidentDate ? new Date(it.incidentDate).toLocaleDateString() : '-'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-slate-500">Created:</span>
                                                            <p className="text-slate-700">{new Date(it.createdAt).toLocaleString()}</p>
                                                        </div>
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
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Category</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Priority</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Evidence</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Incident Date</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-3 py-6 text-center text-slate-600">
                                                    No incidents found.
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((it) => (
                                                <tr key={it._id} className="border-t border-slate-200">
                                                    <td className="px-3 py-2 text-slate-900">{it.title}</td>
                                                    <td className="px-3 py-2 text-slate-700">{it.category}</td>
                                                    <td className="px-3 py-2 text-slate-700">{it.priority}</td>
                                                    <td className="px-3 py-2 text-slate-700">{it.status}</td>
                                                    <td className="px-3 py-2">
                                                        <EvidenceViewer evidenceFiles={it.evidenceFiles} />
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-700">{it.incidentDate ? new Date(it.incidentDate).toLocaleDateString() : '-'}</td>
                                                    <td className="px-3 py-2 text-slate-700">{new Date(it.createdAt).toLocaleString()}</td>
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
