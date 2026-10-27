import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-border bg-brand-bg/50 px-6 py-14 text-center">
      {icon && <div className="mb-4 text-brand-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-brand-text">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-brand-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
