import { useEffect, useState } from 'react';
import { Package, ImageOff } from 'lucide-react';

type SmartImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  loading?: 'lazy' | 'eager';
  fallbackIcon?: 'package' | 'image';
  fallbackLabel?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Image with graceful degradation:
 *  - shows a branded placeholder if src is missing or fails to load
 *  - fades the image in once loaded
 *  - never leaves a broken-image icon visible to the user
 */
export function SmartImage({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  loading = 'lazy',
  fallbackIcon = 'package',
  fallbackLabel,
  sizes,
  priority = false,
}: SmartImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    src ? 'loading' : 'error'
  );

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }
    setStatus('loading');
  }, [src]);

  const Icon = fallbackIcon === 'image' ? ImageOff : Package;

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {src && status !== 'error' ? (
        <>
          {status === 'loading' && (
            <div className="absolute inset-0 animate-pulse bg-brand-bg" aria-hidden="true" />
          )}
          <img
            src={src}
            alt={alt}
            sizes={sizes}
            loading={priority ? 'eager' : loading}
            decoding="async"
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
            className={`${className} transition-opacity duration-500 ${
              status === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-bg to-brand-bg/40 text-brand-muted"
          role="img"
          aria-label={fallbackLabel ?? alt}
        >
          <Icon className="h-10 w-10 opacity-50" aria-hidden="true" />
          {fallbackLabel && (
            <span className="px-4 text-center text-xs font-medium">{fallbackLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
