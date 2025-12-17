import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createUser, deleteUser, listUsers, updateUser } from '@/services/superadmin'

const roles = ['USER', 'ADMIN', 'SUPER_ADMIN']

export default function UsersPage() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')
    const [role, setRole] = useState('All')
    const [isBlocked, setIsBlocked] = useState('All')

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [newRole, setNewRole] = useState('USER')

    const params = useMemo(() => {
        const p = {}
        if (search.trim()) p.search = search.trim()
        if (role !== 'All') p.role = role
        if (isBlocked !== 'All') p.isBlocked = isBlocked
        return p
    }, [search, role, isBlocked])

    const refresh = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await listUsers(params)
            setItems(res.items || [])
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params])

    const onCreate = async () => {
        setError('')
        if (!name.trim() || !email.trim() || !password) {
            setError('name, email, password are required')
            return
        }

        await createUser({ name, email, password, role: newRole })
        setName('')
        setEmail('')
        setPassword('')
        setNewRole('USER')
        refresh()
    }

    const onToggleBlock = async (u) => {
        await updateUser(u._id, { isBlocked: !u.isBlocked })
        refresh()
    }

    const onRoleChange = async (u, roleValue) => {
        await updateUser(u._id, { role: roleValue })
        refresh()
    }

    const onDelete = async (u) => {
        await deleteUser(u._id)
        refresh()
    }

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Create users, assign roles, block/unblock, delete</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-4">
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                        <div className="flex gap-2">
                            <select className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                {roles.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            <Button type="button" onClick={onCreate}>Add</Button>
                        </div>
                    </div>

                    {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" />
                        </div>
                        <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="All">All Roles</option>
                            {roles.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={isBlocked} onChange={(e) => setIsBlocked(e.target.value)}>
                            <option value="All">All</option>
                            <option value="true">Blocked</option>
                            <option value="false">Active</option>
                        </select>
                    </div>

                    {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

                    {!loading ? (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full border border-slate-200 bg-white text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-slate-700">Name</th>
                                        <th className="px-3 py-2 text-left font-medium text-slate-700">Email</th>
                                        <th className="px-3 py-2 text-left font-medium text-slate-700">Role</th>
                                        <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                                        <th className="px-3 py-2 text-left font-medium text-slate-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((u) => (
                                        <tr key={u._id} className="border-t border-slate-200">
                                            <td className="px-3 py-2 text-slate-900">{u.name}</td>
                                            <td className="px-3 py-2 text-slate-700">{u.email}</td>
                                            <td className="px-3 py-2">
                                                <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={u.role} onChange={(e) => onRoleChange(u, e.target.value)}>
                                                    {roles.map((r) => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">{u.isBlocked ? 'Blocked' : 'Active'}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => onToggleBlock(u)}>
                                                        {u.isBlocked ? 'Unblock' : 'Block'}
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => onDelete(u)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
