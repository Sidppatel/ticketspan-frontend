import { useEffect, type RefObject } from 'react';

type Gsap = typeof import('gsap')['gsap'];

function attachMagnet(gsap: Gsap, el: HTMLElement) {
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

function heroTicketScene(gsap: Gsap) {
  const scene = document.querySelector<HTMLElement>('[data-ticket-scene]');
  if (!scene) return;
  gsap.to(scene, {
    y: -30,
    ease: 'none',
    scrollTrigger: { trigger: scene, start: 'top 80%', end: 'bottom top', scrub: 0.8 },
  });
}

export function useLandingReveal(scope: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let disposed = false;
    let ctx: { revert(): void } | undefined;
    const start = () => void Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/SplitText'),
    ]).then(([{ gsap }, { ScrollTrigger }, { SplitText }]) => {
      if (disposed || !scope.current) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
          const belowFold = (el: HTMLElement) => el.getBoundingClientRect().top > window.innerHeight;
          gsap.utils.toArray<HTMLElement>('[data-split]').filter(belowFold).forEach((heading) => {
            SplitText.create(heading, {
              type: 'lines',
              autoSplit: true,
              onSplit: (self) =>
                gsap.from(self.lines, {
                  yPercent: 60,
                  opacity: 0,
                  duration: 0.9,
                  ease: 'power4.out',
                  stagger: 0.09,
                  scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
                }),
            });
          });
          gsap.utils.toArray<HTMLElement>('[data-reveal]').filter(belowFold).forEach((el) => {
            gsap.from(el, {
              opacity: 0,
              y: 26,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            });
          });
          heroTicketScene(gsap);
          const cleanups = gsap.utils
            .toArray<HTMLElement>('[data-magnet]')
            .map((el) => attachMagnet(gsap, el));
          return () => cleanups.forEach((fn) => fn());
        });
        return () => mm.revert();
      }, scope);
    });

    const events = ['scroll', 'pointerdown', 'pointermove', 'touchstart', 'keydown'] as const;
    let started = false;
    const startOnce = () => {
      if (started) return;
      if (!window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches) return;
      started = true;
      events.forEach((e) => window.removeEventListener(e, startOnce));
      start();
    };
    events.forEach((e) => window.addEventListener(e, startOnce, { passive: true, once: false }));

    return () => {
      disposed = true;
      events.forEach((e) => window.removeEventListener(e, startOnce));
      ctx?.revert();
    };
  }, [scope]);
}
