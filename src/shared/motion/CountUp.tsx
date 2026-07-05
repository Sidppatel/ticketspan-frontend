import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const defaultFormat = (n: number) => Math.round(n).toLocaleString();

export function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = format ?? defaultFormat;
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) {
        return;
      }
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const state = { n: 0 };
        gsap.to(state, {
          n: value,
          duration: 0.9,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = fmt(state.n);
          },
        });
      });
      return () => mm.revert();
    },
    { dependencies: [value] },
  );
  return <span ref={ref}>{fmt(value)}</span>;
}
