import { useCallback, useEffect, useRef, useState } from 'react';

// The inspector is rendered in a portal and positioned against the viewport,
// so dragging it is independent of the canvas/preview's scroll and clipping.
export default function useMovablePanel() {
  const [position, setPosition] = useState(null);
  const drag = useRef(null);

  const onPointerDown = useCallback((event) => {
    if (event.button !== 0 || event.target.closest('button')) return;
    const panel = event.currentTarget.closest('.pm-floating-inspector');
    const rect = panel?.getBoundingClientRect();
    if (!rect) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }, []);

  useEffect(() => {
    const move = (event) => {
      if (!drag.current || (drag.current.pointerId != null && event.pointerId != null && drag.current.pointerId !== event.pointerId)) return;
      const d = drag.current;
      const left = d.left + event.clientX - d.x;
      const top = d.top + event.clientY - d.y;
      const margin = 8;
      const maxLeft = Math.max(margin, window.innerWidth - Math.min(d.width, window.innerWidth - margin * 2) - margin);
      const maxTop = Math.max(margin, window.innerHeight - Math.min(d.height, window.innerHeight - margin * 2) - margin);
      setPosition({ left: Math.max(margin, Math.min(maxLeft, left)), top: Math.max(margin, Math.min(maxTop, top)) });
    };
    const up = () => { drag.current = null; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const reset = useCallback(() => setPosition(null), []);
  const panelStyle = position
    ? { position: 'fixed', left: `${position.left}px`, top: `${position.top}px`, right: 'auto', bottom: 'auto' }
    : { position: 'fixed', right: '16px', top: '86px', left: 'auto', bottom: 'auto' };

  return { panelStyle, handlePointerDown: onPointerDown, reset };
}
