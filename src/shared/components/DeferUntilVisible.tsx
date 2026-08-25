import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DeferUntilVisibleProps {
  children: ReactNode;
  minHeight: number | string;
  className?: string;
}

export function DeferUntilVisible({ children, minHeight, className }: DeferUntilVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    <div
      ref={ref}
      className={className}
      style={show ? undefined : { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
    >
      {show ? children : null}
    </div>
  );
}
