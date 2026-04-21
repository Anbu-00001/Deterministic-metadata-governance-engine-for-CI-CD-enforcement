'use client';

import { useRef, useCallback, useEffect, ReactNode, CSSProperties } from 'react';

const CANVAS_COLORS = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
};

interface Transform { x: number; y: number; scale: number; }

interface DesignCanvasProps {
  children: ReactNode;
  minScale?: number;
  maxScale?: number;
  style?: CSSProperties;
}

export function DesignCanvas({ children, minScale = 0.1, maxScale = 8, style = {} }: DesignCanvasProps) {
  const vpRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const tf = useRef<Transform>({ x: 0, y: 0, scale: 1 });

  const apply = useCallback(() => {
    const { x, y, scale } = tf.current;
    if (worldRef.current) {
      worldRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }
  }, []);

  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;

    const zoomAt = (cx: number, cy: number, factor: number) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left;
      const py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
    };

    const isMouseWheel = (e: WheelEvent) =>
      e.deltaMode !== 0 ||
      (e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40);

    let isGesturing = false;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isGesturing) return;
      if (e.ctrlKey) {
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    // Safari gesture events (typed as any — not in standard TS DOM lib)
    let gsBase = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      isGesturing = true;
      gsBase = tf.current.scale;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const ge = e as Event & { clientX: number; clientY: number; scale: number };
      zoomAt(ge.clientX, ge.clientY, (gsBase * ge.scale) / tf.current.scale);
    };
    const onGestureEnd = (e: Event) => { e.preventDefault(); isGesturing = false; };

    let drag: { id: number; lx: number; ly: number } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      const onBg = e.target === vp || e.target === worldRef.current;
      if (!(e.button === 1 || (e.button === 0 && onBg))) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, lx: e.clientX, ly: e.clientY };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    vp.addEventListener('wheel', onWheel, { passive: false });
    vp.addEventListener('gesturestart', onGestureStart, { passive: false });
    vp.addEventListener('gesturechange', onGestureChange, { passive: false });
    vp.addEventListener('gestureend', onGestureEnd, { passive: false });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);

    return () => {
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
      vp.removeEventListener('gestureend', onGestureEnd);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply, minScale, maxScale]);

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(CANVAS_COLORS.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;

  return (
    <div
      ref={vpRef}
      style={{
        height: '100vh',
        width: '100vw',
        background: CANVAS_COLORS.bg,
        overflow: 'hidden',
        overscrollBehavior: 'none',
        touchAction: 'none',
        position: 'relative',
        fontFamily: CANVAS_COLORS.font,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div
        ref={worldRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
          willChange: 'transform',
          width: 'max-content',
          minWidth: '100%',
          minHeight: '100%',
          padding: '60px 0 80px',
          backgroundImage: gridSvg,
          backgroundSize: '120px 120px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────
interface DCSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  gap?: number;
}

export function DCSection({ title, subtitle, children, gap = 48 }: DCSectionProps) {
  return (
    <div style={{ marginBottom: 80, position: 'relative' }}>
      <div style={{ padding: '0 60px 36px' }}>
        <div style={{
          fontSize: 22,
          fontWeight: 600,
          color: CANVAS_COLORS.title,
          letterSpacing: -0.3,
          marginBottom: 4,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 14, fontWeight: 400, color: CANVAS_COLORS.subtitle }}>
            {subtitle}
          </div>
        )}
      </div>
      <div style={{
        display: 'flex',
        gap,
        padding: '0 60px',
        alignItems: 'flex-start',
        width: 'max-content',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Artboard ─────────────────────────────────────────────────
interface DCArtboardProps {
  label?: string;
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
}

export function DCArtboard({ label, children, width, height, style = {} }: DCArtboardProps) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {label && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          paddingBottom: 8,
          fontSize: 12,
          fontWeight: 500,
          color: CANVAS_COLORS.label,
          whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
      )}
      <div style={{
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        width,
        height,
        background: '#fff',
        ...style,
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── PostIt ───────────────────────────────────────────────────
interface DCPostItProps {
  children: ReactNode;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  rotate?: number;
  width?: number;
}

export function DCPostIt({ children, top, left, right, bottom, rotate = -2, width = 180 }: DCPostItProps) {
  return (
    <div style={{
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width,
      background: CANVAS_COLORS.postitBg,
      padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14,
      lineHeight: 1.4,
      color: CANVAS_COLORS.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: `rotate(${rotate}deg)`,
      zIndex: 5,
    }}>
      {children}
    </div>
  );
}
