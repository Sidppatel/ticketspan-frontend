import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

export function usePageEntrance<T extends HTMLElement = HTMLElement>() {
  const scope = useRef<T>(null);
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) {
        return;
      }
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const first = root.firstElementChild;
        const targets =
          first && first.children.length > 1 ? first.children : root.children;
        gsap.from(targets, {
          opacity: 0,
          y: 16,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.06,
        });
      });
      return () => mm.revert();
    },
    { scope },
  );
  return scope;
}
