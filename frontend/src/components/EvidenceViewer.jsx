import { Button } from '@/components/ui/button'

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'

export default function EvidenceViewer({ evidenceFiles = [] }) {
    if (!evidenceFiles || evidenceFiles.length === 0) {
        return <span className="text-slate-500 text-sm">—</span>
    }

    const handleView = (file) => {
        const url = `${BACKEND_URL}${file}`
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    const isPDF = (file) => {
        return file.toLowerCase().endsWith('.pdf')
    }

    return (
        <div className="flex flex-wrap gap-1">
            {evidenceFiles.map((file, idx) => {
                const isPdf = isPDF(file)

                return (
                    <div key={idx}>
                        {isPdf ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(file)}
                                className="text-xs h-7 px-2"
                            >
                                📄 View PDF
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(file)}
                                className="text-xs h-7 px-2"
                            >
                                🖼️ View
                            </Button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
