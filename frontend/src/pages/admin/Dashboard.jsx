import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { listIncidents } from '@/services/incidents'
import { bulkResolve, exportCsv, exportPdf, getStats, listAssignableAdmins, updateIncident } from '@/services/admin'
import { useSocket } from '@/context/SocketContext'
import EvidenceViewer from '@/components/EvidenceViewer'

export default function AdminDashboard() {
    const { socket } = useSocket() || {}

    const [stats, setStats] = useState(null)
    const [admins, setAdmins] = useState([])
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('All')
    const [category, setCategory] = useState('All')
    const [priority, setPriority] = useState('All')
    const [sort, setSort] = useState('-createdAt')

    const [selected, setSelected] = useState(() => new Set())
    const [bulkAdminId, setBulkAdminId] = useState('')
    const [notice, setNotice] = useState('')

    const categories = useMemo(() => {
        const set = new Set(['All'])
            ; (stats?.categoryBreakdown || []).forEach((c) => set.add(c.category))
        if (set.size === 1) {
            ;[
                'Security Breach',
                'Data Leak',
                'System Failure',
                'Unauthorized Access',
                'Malware',
                'Phishing',
                'Ransomware',
                'Other',
            ].forEach((c) => set.add(c))
        }
        return Array.from(set)
    }, [stats])

    const statusOptions = ['All', 'Open', 'In Progress', 'Resolved', 'Closed']
    const priorityOptions = ['All', 'Low', 'Medium', 'High', 'Critical']

    const params = useMemo(() => {
        const p = { sort }
        if (search.trim()) p.search = search.trim()
        if (status !== 'All') p.status = status
        if (category !== 'All') p.category = category
        if (priority !== 'All') p.priority = priority
        return p
    }, [search, status, category, priority, sort])

    const refreshAll = async () => {
        setLoading(true)
        setError('')
        try {
            const [s, inc, ad] = await Promise.all([
                getStats(),
                listIncidents(params),
                listAssignableAdmins(),
            ])
            setStats(s)
            setItems(inc.items || [])
            setAdmins(ad.items || [])
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to load admin dashboard')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params])

    useEffect(() => {
        if (!socket) return

        const onNew = (data) => {
            setNotice(`New incident reported: "${data.title}"`)
            refreshAll()
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
            refreshAll()
            window.setTimeout(() => setNotice(''), 5000)
        }

        const onDelete = (data) => {
            setNotice(`Incident "${data.title}" has been deleted`)
            refreshAll()
            window.setTimeout(() => setNotice(''), 5000)
        }

        const onBulkResolve = (data) => {
            setNotice(`${data.count} incident(s) have been resolved`)
            refreshAll()
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

    const toggleSelected = (id) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const setAllSelected = (checked) => {
        if (!checked) {
            setSelected(new Set())
            return
        }
        setSelected(new Set(items.map((i) => i._id)))
    }

    const onBulkResolve = async () => {
        const ids = Array.from(selected)
        if (ids.length === 0) return
        await bulkResolve(ids)
        setSelected(new Set())
        refreshAll()
    }

    const onBulkAssign = async () => {
        const ids = Array.from(selected)
        if (ids.length === 0 || !bulkAdminId) return
        await Promise.all(ids.map((id) => updateIncident(id, { assignedTo: bulkAdminId })))
        setSelected(new Set())
        setBulkAdminId('')
        refreshAll()
    }

    const onUpdateRow = async (id, patch) => {
        await updateIncident(id, patch)
        refreshAll()
    }

    const openCount = (stats?.statusBreakdown || []).find((s) => s.status === 'Open')?.count || 0
    const resolvedCount = (stats?.statusBreakdown || []).find((s) => s.status === 'Resolved')?.count || 0

    const pieData = [
        { name: 'Open', value: openCount },
        { name: 'Resolved', value: resolvedCount },
    ]
    const pieColors = ['#f59e0b', '#10b981']

    const barData = (stats?.categoryBreakdown || []).map((c) => ({ name: c.category, count: c.count }))

    const avgHours = stats?.avgResolutionMs ? Math.round((stats.avgResolutionMs / (1000 * 60 * 60)) * 10) / 10 : 0

    return (
        <div className="grid gap-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-lg font-semibold text-slate-900">Admin Dashboard</div>
                    <div className="text-sm text-slate-600">Analytics + incident management</div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => exportCsv(params)}>Export CSV</Button>
                    <Button variant="outline" onClick={() => exportPdf(params)}>Export PDF</Button>
                </div>
            </div>

            {notice ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    {notice}
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Incidents</CardTitle>
                        <CardDescription>All reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-slate-900">{stats?.totalIncidents ?? '—'}</div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Open vs Resolved</CardTitle>
                        <CardDescription>Status split</CardDescription>
                    </CardHeader>
                    <CardContent style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={60}>
                                    {pieData.map((_, idx) => (
                                        <Cell key={idx} fill={pieColors[idx]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Most Common Categories</CardTitle>
                        <CardDescription>Top categories</CardDescription>
                    </CardHeader>
                    <CardContent style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" hide />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#0ea5e9" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Avg Resolution Time</CardTitle>
                        <CardDescription>Resolved incidents</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-slate-900">{avgHours ? `${avgHours}h` : '—'}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Incidents</CardTitle>
                    <CardDescription>Filter, assign, resolve, export</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-5">
                        <div className="md:col-span-2">
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents…" />
                        </div>

                        <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                            {statusOptions.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>

                        <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                            {priorityOptions.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" disabled={selected.size === 0} onClick={onBulkResolve}>Bulk Resolve</Button>
                            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={bulkAdminId} onChange={(e) => setBulkAdminId(e.target.value)}>
                                <option value="">Assign selected…</option>
                                {admins.map((a) => (
                                    <option key={a._id} value={a._id}>{a.name} ({a.role})</option>
                                ))}
                            </select>
                            <Button variant="outline" disabled={selected.size === 0 || !bulkAdminId} onClick={onBulkAssign}>Assign</Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="text-xs text-slate-600">Sort by</div>
                            <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
                                <option value="-createdAt">Date (Newest)</option>
                                <option value="createdAt">Date (Oldest)</option>
                                <option value="priority">Severity (Priority)</option>
                                <option value="-priority">Severity (High to Low)</option>
                                <option value="createdBy">User Reports</option>
                                <option value="-incidentDate">Incident Date (Recent)</option>
                                <option value="incidentDate">Incident Date (Oldest)</option>
                            </select>
                        </div>
                    </div>

                    {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}
                    {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

                    {!loading && !error ? (
                        <div className="mt-4 overflow-x-auto -mx-4 px-4">
                            <div className="block lg:hidden">
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
                                                            <span className="text-xs text-slate-500">User:</span>
                                                            <p className="text-slate-700">{it.createdBy?.email || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-slate-500">Category:</span>
                                                            <p className="text-slate-700">{it.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className="text-xs text-slate-500">Priority:</span>
                                                            <p className="text-slate-700">{it.priority}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-slate-500">Status:</span>
                                                            <select className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs" value={it.status} onChange={(e) => onUpdateRow(it._id, { status: e.target.value })}>
                                                                {statusOptions.filter((s) => s !== 'All').map((s) => (
                                                                    <option key={s} value={s}>{s}</option>
                                                                ))}
                                                            </select>
                                                        </div>
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
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="hidden lg:block">
                                <table className="min-w-full border border-slate-200 bg-white text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">
                                                <input type="checkbox" checked={items.length > 0 && selected.size === items.length} onChange={(e) => setAllSelected(e.target.checked)} />
                                            </th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Title</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">User</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Category</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Priority</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Assigned</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Evidence</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Incident Date</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="px-3 py-6 text-center text-slate-600">No incidents found.</td>
                                            </tr>
                                        ) : (
                                            items.map((it) => (
                                                <tr key={it._id} className="border-t border-slate-200">
                                                    <td className="px-3 py-2">
                                                        <input type="checkbox" checked={selected.has(it._id)} onChange={() => toggleSelected(it._id)} />
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-900">{it.title}</td>
                                                    <td className="px-3 py-2 text-slate-700">{it.createdBy?.email || '-'}</td>
                                                    <td className="px-3 py-2 text-slate-700">{it.category}</td>
                                                    <td className="px-3 py-2 text-slate-700">{it.priority}</td>
                                                    <td className="px-3 py-2">
                                                        <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={it.status} onChange={(e) => onUpdateRow(it._id, { status: e.target.value })}>
                                                            {statusOptions.filter((s) => s !== 'All').map((s) => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={it.assignedTo?._id || ''} onChange={(e) => onUpdateRow(it._id, { assignedTo: e.target.value || null })}>
                                                            <option value="">Unassigned</option>
                                                            {admins.map((a) => (
                                                                <option key={a._id} value={a._id}>{a.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
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
