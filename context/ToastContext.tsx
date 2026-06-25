'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastNotification {
    type: ToastType
    message: string
}

interface Toast {
    id: string
    type: ToastType
    message: string
}

interface ToastContextType {
    setToastNotification: (notification: ToastNotification) => void  
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const setToastNotification = useCallback(({ type, message }: ToastNotification) => {
        const id = Math.random().toString(36).slice(2)

        setToasts((prev) => [...prev, { id, type, message }])

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3000)
    }, [])

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    const toastStyles: Record<ToastType, string> = {
        success: 'bg-green-500 text-white',
        error:   'bg-red-500 text-white',
        warning: 'bg-yellow-400 text-black',
        info:    'bg-blue-500 text-white',
    }

    const toastIcons: Record<ToastType, string> = {
        success: '',
        error:   '',
        warning: '',
        info:    '',
    }

    return (
        <ToastContext.Provider value={{ setToastNotification }}>
            {children}

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            flex items-center gap-2
                            px-4 py-3 rounded-lg shadow-lg
                            min-w-[250px] max-w-[400px]
                            ${toastStyles[toast.type]}
                        `}
                    >
                        <span>{toastIcons[toast.type]}</span>
                        <span className="flex-1 text-sm font-medium">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 text-lg font-bold opacity-70 hover:opacity-100"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast(): ToastContextType {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider')
    return context
}