import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createIncident } from '@/services/incidents'

const categories = [
    'Security Breach',
    'Data Leak',
    'System Failure',
    'Unauthorized Access',
    'Malware',
    'Phishing',
    'Ransomware',
    'Other',
]

const priorities = ['Low', 'Medium', 'High']

export default function CreateIncidentPage() {
    const navigate = useNavigate()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('Phishing')
    const [priority, setPriority] = useState('Medium')
    const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0])
    const [files, setFiles] = useState([])

    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const validationError = useMemo(() => {
        if (!title.trim()) return 'Title is required'
        if (!description.trim()) return 'Description is required'
        if (!category) return 'Category is required'
        if (!priority) return 'Priority is required'
        if (!incidentDate) return 'Incident date is required'
        if (files.length > 5) return 'Max 5 files allowed'

        // Validate file sizes (5MB each)
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                return `File "${file.name}" exceeds 5MB limit`
            }
        }

        // Validate file formats
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                return `File "${file.name}" is not a valid format. Allowed: JPG, PNG, PDF`
            }
        }

        return ''
    }, [title, description, category, priority, incidentDate, files])

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (validationError) {
            setError(validationError)
            return
        }

        setBusy(true)
        try {
            await createIncident({
                title,
                description,
                category,
                priority,
                incidentDate,
                evidenceFiles: files,
            })
            navigate('/user')
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to create incident')
        } finally {
            setBusy(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Report an Incident</CardTitle>
                <CardDescription>Submit a secure incident report with optional evidence files</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="grid gap-4">
                    <div className="grid gap-1">
                        <div className="text-sm font-medium text-slate-700">Title</div>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident title" />
                    </div>

                    <div className="grid gap-1">
                        <div className="text-sm font-medium text-slate-700">Description</div>
                        <textarea
                            className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what happened, impact, affected systems, etc."
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="grid gap-1">
                            <div className="text-sm font-medium text-slate-700">Category</div>
                            <select
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-1">
                            <div className="text-sm font-medium text-slate-700">Priority</div>
                            <select
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                {priorities.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-1">
                            <div className="text-sm font-medium text-slate-700">Date</div>
                            <Input
                                type="date"
                                value={incidentDate}
                                onChange={(e) => setIncidentDate(e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <div className="text-sm font-medium text-slate-700">Evidence (jpg/png/pdf, max 5 files, 5MB each)</div>
                        <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        />
                    </div>

                    {error ? <div className="text-sm text-red-600">{error}</div> : null}

                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</Button>
                        <Button type="button" variant="outline" onClick={() => navigate('/user')}>Cancel</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
