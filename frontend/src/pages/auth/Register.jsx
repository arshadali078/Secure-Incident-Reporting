import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
    const { register } = useAuth()
    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setBusy(true)

        try {
            const u = await register({ name, email, password })
            if (u.role === 'SUPER_ADMIN') navigate('/superadmin')
            else if (u.role === 'ADMIN') navigate('/admin')
            else navigate('/user')
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Registration failed')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create account</CardTitle>
                    <CardDescription>Report incidents securely and track their status</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-3">
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-slate-700">Name</div>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-slate-700">Email</div>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-slate-700">Password</div>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                        </div>

                        {error ? <div className="text-sm text-red-600">{error}</div> : null}

                        <Button type="submit" className="w-full" disabled={busy}>
                            {busy ? 'Creating…' : 'Create account'}
                        </Button>

                        <div className="text-sm text-slate-600">
                            Already have an account?{' '}
                            <Link className="text-slate-900 underline" to="/login">Sign in</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
