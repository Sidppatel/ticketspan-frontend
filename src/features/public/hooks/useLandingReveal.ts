import type { RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

function attachMagnet(el: HTMLElement) {
  const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
  const onMove = (e: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const reach = 80;
    if (Math.abs(dx) < rect.width / 2 + reach && Math.abs(dy) < rect.height / 2 + reach) {
      xTo(gsap.utils.clamp(-6, 6, dx * 0.12));
      yTo(gsap.utils.clamp(-4, 4, dy * 0.12));
    } else {
      xTo(0);
      yTo(0);
    }
  };
  window.addEventListener('mousemove', onMove);
  return () => window.removeEventListener('mousemove', onMove);
}

export function useLandingReveal(scope: RefObject<HTMLDivElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-split]').forEach((heading) => {
          SplitText.create(heading, {
            type: 'lines',
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                duration: 0.55,
                ease: 'power3.out',
                stagger: 0.06,
                scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
              }),
          });
        });
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 18,
            duration: 0.45,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          });
        });
        const cleanups = gsap.utils
          .toArray<HTMLElement>('[data-magnet]')
          .map((el) => attachMagnet(el));
        return () => cleanups.forEach((fn) => fn());
      });
      return () => mm.revert();
    },
    { scope },
  );
}
