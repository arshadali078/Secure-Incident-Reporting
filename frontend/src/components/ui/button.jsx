import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-white',
    {
        variants: {
            variant: {
                default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90',
                outline: 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-900',
                ghost: 'hover:bg-slate-100 text-slate-900',
                destructive: 'bg-red-600 text-white hover:bg-red-600/90',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 px-3 rounded-md',
                lg: 'h-11 px-8 rounded-md',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

function Button({ className, variant, size, ...props }) {
    return (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { Button }
