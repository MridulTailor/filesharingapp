import { useEffect, useRef } from 'react';

export const GridBackground = () => {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !glowRef.current) return;
      glowRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
      glowRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    const onLeave = () => {
      if (!glowRef.current) return;
      glowRef.current.style.setProperty('--mouse-x', '-999px');
      glowRef.current.style.setProperty('--mouse-y', '-999px');
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="bg-grid-base absolute inset-0" />
      <div ref={glowRef} className="bg-grid-glow absolute inset-0" />
    </div>
  );
};
