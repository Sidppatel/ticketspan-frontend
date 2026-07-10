import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let instance: Lenis | null = null;
let rafId = 0;
let refCount = 0;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function acquireLenis(): () => void {
  if (prefersReducedMotion()) {
    return () => {};
  }
  refCount += 1;
  if (!instance) {
    instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    instance.on('scroll', ScrollTrigger.update);
    const loop = (time: number) => {
      instance?.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    ScrollTrigger.refresh();
  }
  return () => {
    refCount -= 1;
    if (refCount <= 0 && instance) {
      cancelAnimationFrame(rafId);
      instance.destroy();
      instance = null;
      refCount = 0;
    }
  };
}
