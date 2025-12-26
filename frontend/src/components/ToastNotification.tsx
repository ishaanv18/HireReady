import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, duration?: number) => void
    success: (message: string, duration?: number) => void
    error: (message: string, duration?: number) => void
    info: (message: string, duration?: number) => void
    warning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substring(7)
        const toast: Toast = { id, type, message, duration }

        setToasts(prev => [...prev, toast])

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration)
        }
    }, [removeToast])

    const success = useCallback((message: string, duration?: number) => {
        showToast('success', message, duration)
    }, [showToast])

    const error = useCallback((message: string, duration?: number) => {
        showToast('error', message, duration)
    }, [showToast])

    const info = useCallback((message: string, duration?: number) => {
        showToast('info', message, duration)
    }, [showToast])

    const warning = useCallback((message: string, duration?: number) => {
        showToast('warning', message, duration)
    }, [showToast])

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

interface ToastContainerProps {
    toasts: Toast[]
    onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
                ))}
            </AnimatePresence>
        </div>
    )
}

interface ToastItemProps {
    toast: Toast
    onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const config = {
        success: {
            icon: CheckCircle,
            className: 'bg-green-50 border-green-200 text-green-800',
            iconClassName: 'text-green-500'
        },
        error: {
            icon: XCircle,
            className: 'bg-red-50 border-red-200 text-red-800',
            iconClassName: 'text-red-500'
        },
        info: {
            icon: Info,
            className: 'bg-blue-50 border-blue-200 text-blue-800',
            iconClassName: 'text-blue-500'
        },
        warning: {
            icon: AlertTriangle,
            className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            iconClassName: 'text-yellow-500'
        }
    }

    const { icon: Icon, className, iconClassName } = config[toast.type]

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md ${className}`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${iconClassName}`} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    )
}
