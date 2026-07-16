import { useEffect, useRef } from 'react';

export function usePageEntrance<T extends HTMLElement = HTMLElement>() {
  const scope = useRef<T>(null);
  useEffect(() => {
    let disposed = false;
    let ctx: { revert(): void } | undefined;
    void import('gsap').then(({ gsap }) => {
      const root = scope.current;
      if (disposed || !root) return;
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
          const first = root.firstElementChild;
          const targets =
            first && first.children.length > 1 ? first.children : root.children;
          const limited = Array.from(targets).slice(0, 6);
          gsap.from(limited, {
            y: 12,
            duration: 0.48,
            ease: 'power3.out',
            stagger: 0.04,
          });
        });
        return () => mm.revert();
      }, scope);
    });
    return () => {
      disposed = true;
      ctx?.revert();
    };
  }, []);
  return scope;
}
