import { useEffect, useRef, useState, type ElementType } from 'react';

/**
 * Reveals an element on scroll-into-view by toggling the `is-visible` class.
 * Pairs with the `.reveal` / `.reveal-scale` CSS classes in index.css.
 * Respects prefers-reduced-motion (CSS disables the transform).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  once?: boolean;
  rootMargin?: string;
}) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (options?.once !== false) observer.unobserve(entry.target);
          } else if (options?.once === false) {
            setVisible(false);
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.15,
        rootMargin: options?.rootMargin ?? '0px 0px -8% 0px',
      }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [options?.threshold, options?.once, options?.rootMargin]);

  return { ref, visible };
}

/**
 * Convenience wrapper: pass the tag, base classes, and optional reveal variant.
 * The element automatically animates in when scrolled into view.
 */
export function Reveal({
  as: Tag = 'div',
  className = '',
  variant = 'reveal',
  delay = 0,
  threshold,
  once,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  variant?: 'reveal' | 'reveal-scale';
  delay?: number;
  threshold?: number;
  once?: boolean;
  children?: React.ReactNode;
} & Record<string, unknown>) {
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold, once });
  return (
    <Tag
      ref={ref}
      className={`${variant} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}
