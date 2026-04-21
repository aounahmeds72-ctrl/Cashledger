import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <div className={`
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border min-w-[280px]
                ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300' : 
                  toast.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800/50 text-rose-800 dark:text-rose-300' : 
                  'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50 text-blue-800 dark:text-blue-300'}
              `}>
                {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-500 dark:text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle size={18} className="text-rose-500 dark:text-rose-400" />}
                {toast.type === 'info' && <AlertCircle size={18} className="text-blue-500 dark:text-blue-400" />}
                
                <span className="flex-1 text-sm font-medium">{toast.message}</span>
                
                <button 
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
