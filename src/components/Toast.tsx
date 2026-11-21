import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const type = toast.type || 'success';
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />,
          error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
        };

        const bgColors = {
          success: 'bg-white border-emerald-200 shadow-emerald-500/10',
          info: 'bg-white border-blue-200 shadow-blue-500/10',
          warning: 'bg-white border-orange-200 shadow-orange-500/10',
          error: 'bg-white border-rose-200 shadow-rose-500/10'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 ${bgColors[type]}`}
          >
            {icons[type]}
            <div className="flex-1 text-sm">
              <p className="font-semibold text-slate-800">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-slate-500 mt-0.5">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
