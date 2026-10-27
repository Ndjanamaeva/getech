export function Loading({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[200px]'}`}
      role="status"
      aria-label="Chargement"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary" />
        <span className="text-sm text-brand-muted">Chargement…</span>
      </div>
    </div>
  );
}
