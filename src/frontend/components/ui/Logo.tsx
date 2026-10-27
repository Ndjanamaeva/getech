import { siteConfig } from '@/backend/lib/config';

export function Logo({
  variant = 'dark',
  className = '',
}: {
  variant?: 'light' | 'dark';
  className?: string;
}) {
  const textColor = variant === 'light' ? 'text-white' : 'text-brand-text';
  const subColor = variant === 'light' ? 'text-white/55' : 'text-brand-muted';
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-brand-primary">
        <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden="true">
          <path
            d="M20 42 L32 22 L44 42"
            stroke="white"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="46" r="3" fill="#D62839" />
        </svg>
      </div>
      <div className={`flex flex-col leading-none ${textColor}`}>
        <span className="font-display text-sm font-extrabold tracking-tight">GENESYS</span>
        <span className={`text-[10px] font-semibold tracking-[0.22em] ${subColor}`}>
          CAMEROON
        </span>
      </div>
    </div>
  );
}

export function LogoText({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  return <Logo variant={variant} />;
}

export { siteConfig };
