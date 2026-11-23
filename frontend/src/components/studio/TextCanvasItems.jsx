import { useEffect, useRef } from 'react';

function TextNode({ item, editable, selected, onSelect, onMove }) {
  const drag = useRef(null);
  const down = (event) => {
    if (!editable || event.button !== 0 || event.target.closest('button,input,textarea')) return;
    const stage = event.currentTarget.closest('.pm-page-stage,.pm-bday-stage');
    const bounds = stage?.getBoundingClientRect();
    if (!bounds) return;
    const resizing = Boolean(event.target.closest('[data-resize-handle]'));
    drag.current = resizing
      ? { mode: 'resize', width: bounds.width, startWidth: item.width ?? 80, sx: event.clientX }
      : { mode: 'move', x: item.x ?? 50, y: item.y ?? 300, sx: event.clientX, sy: event.clientY, width: bounds.width };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onSelect?.(`text:${item.id}`);
    event.preventDefault();
  };
  const move = (event) => {
    if (!drag.current) return;
    if (drag.current.mode === 'resize') {
      const nextWidth = drag.current.startWidth + ((event.clientX - drag.current.sx) / drag.current.width) * 100;
      onMove?.(item.id, { width: Math.max(12, Math.min(100, nextWidth)) });
      return;
    }
    onMove?.(item.id, {
      x: Math.max(2, Math.min(98, drag.current.x + (event.clientX - drag.current.sx) / drag.current.width * 100)),
      y: Math.max(0, Math.min(8000, drag.current.y + event.clientY - drag.current.sy))
    });
  };
  const style = {
    left: `${item.x ?? 50}%`, top: `${item.y ?? 300}px`, width: `${item.width ?? 80}%`,
    transform: `translateX(-50%) rotate(${item.rotation || 0}deg)`,
    fontFamily: item.fontFamily || 'inherit', fontSize: `${item.fontSize ?? 24}px`,
    fontWeight: item.fontWeight || 600, fontStyle: item.fontStyle || 'normal',
    lineHeight: item.lineHeight || 1.25, letterSpacing: `${item.letterSpacing || 0}px`,
    textAlign: item.textAlign || 'center', color: item.color || 'inherit',
    background: item.background || 'transparent', padding: `${item.padding ?? 4}px`,
    borderRadius: `${item.borderRadius ?? 0}px`, border: item.borderWidth ? `${item.borderWidth}px solid ${item.borderColor || '#888'}` : 'none',
    boxShadow: item.boxShadow || 'none', textShadow: item.textShadow || 'none',
    opacity: item.opacity ?? 1, zIndex: item.zIndex || 12, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'
  };
  return <div className={`pm-custom-text-node ${editable ? 'is-editable' : ''} ${selected ? 'is-selected' : ''}`} style={style} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onClick={() => editable && onSelect?.(`text:${item.id}`)}>{item.text || 'Your text'}{editable && <span className="pm-custom-text-hint">TEXT · DRAG</span>}{editable && selected && <span className="pm-text-resize-handle" data-resize-handle title="Drag to resize text box" aria-label="Resize text box"/>}</div>;
}

export default function TextCanvasItems({ items = [], editable = false, selected = '', onSelect, onMove }) {
  useEffect(() => {
    const names = [...new Set(items.map((item) => (item.fontFamily || '').match(/'([^']+)'/)?.[1]).filter(Boolean))];
    names.forEach((name) => { const id = `pm-text-font-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; if (document.getElementById(id)) return; const link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;500;600;700;800&display=swap`; document.head.appendChild(link); });
  }, [items]);
  return <>{items.map((item) => <TextNode key={item.id} item={item} editable={editable} selected={selected === `text:${item.id}`} onSelect={onSelect} onMove={onMove}/>)}</>;
}
