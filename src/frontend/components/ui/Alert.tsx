import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type AlertProps = {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
};

const config = {
  info: { icon: Info, cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  success: { icon: CheckCircle2, cls: 'bg-green-50 text-green-800 border-green-200' },
  warning: { icon: AlertCircle, cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  error: { icon: XCircle, cls: 'bg-red-50 text-red-800 border-red-200' },
};

export function Alert({ variant = 'info', title, children }: AlertProps) {
  const { icon: Icon, cls } = config[variant];
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 ${cls}`} role="alert">
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
