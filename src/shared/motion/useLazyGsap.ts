import { useEffect, type RefObject } from 'react';
import type { gsap as GsapCore } from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

export interface GsapBundle {
  gsap: typeof GsapCore;
  ScrollTrigger: typeof ScrollTriggerType;
}

let loaded: Promise<GsapBundle> | null = null;

export function loadGsap(): Promise<GsapBundle> {
  if (!loaded) {
    loaded = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([core, st]) => {
        core.gsap.registerPlugin(st.ScrollTrigger);
        return { gsap: core.gsap, ScrollTrigger: st.ScrollTrigger };
      },
    );
  }
  return loaded;
}

export function useLazyGsap(
  setup: (bundle: GsapBundle) => void | (() => void),
  scope: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    let disposed = false;
    let ctx: { revert(): void } | undefined;
    let cleanup: (() => void) | void;
    void loadGsap().then((bundle) => {
      if (disposed || !scope.current) return;
      ctx = bundle.gsap.context(() => {
        cleanup = setup(bundle);
      }, scope);
    });
    return () => {
      disposed = true;
      cleanup?.();
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
