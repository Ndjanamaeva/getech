import type { ReactNode } from 'react';

type AdminTableProps = {
  children: ReactNode;
  maxHeight?: string;
  className?: string;
};

export function AdminTable({ children, maxHeight = '60vh', className = '' }: AdminTableProps) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="admin-scroll overflow-auto" style={{ maxHeight }}>
        <table className="admin-table w-full">{children}</table>
      </div>
    </div>
  );
}

export function AdminTHead({ children }: { children: ReactNode }) {
  return <thead className="admin-thead">{children}</thead>;
}

export function AdminTBody({ children }: { children: ReactNode }) {
  return <tbody className="admin-tbody divide-y divide-brand-border/60">{children}</tbody>;
}
