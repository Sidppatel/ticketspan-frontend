import { useRef } from 'react';
import { useLazyGsap } from '@/shared/motion/useLazyGsap';

const defaultFormat = (n: number) => Math.round(n).toLocaleString();

interface CountUpProps {
  value: number;
  prefix?: string;
  format?: (n: number) => string;
}

export function CountUp({ value, prefix = '', format }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = format ?? defaultFormat;
  useLazyGsap(
    ({ gsap }) => {
      const el = ref.current;
      if (!el) {
        return;
      }
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const state = { n: 0 };
        gsap.to(state, {
          n: value,
          duration: 1.1,
          ease: 'back.out(1.1)',
          onUpdate: () => {
            el.textContent = prefix + fmt(state.n);
          },
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        });
      });
      return () => mm.revert();
    },
    ref,
    [value],
  );
  return <span ref={ref}>{prefix + fmt(value)}</span>;
}
