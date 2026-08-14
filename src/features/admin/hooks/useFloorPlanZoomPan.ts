import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent, RefObject } from 'react';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

interface UseFloorPlanZoomPanOptions {
  viewportRef: RefObject<HTMLDivElement | null>;
  CANVAS_W: number;
  CANVAS_H: number;
  undo: () => void;
  redo: () => void;
  deleteSelected: () => void;
  setSelected: (id: string | null) => void;
  pending: unknown;
  canvasPoint: (clientX: number, clientY: number) => { x: number; y: number };
  placeTable: (typeId: string, x: number, y: number) => void;
  placeObject: (objectType: string, x: number, y: number) => void;
  setPending: (v: null) => void;
}

export function useFloorPlanZoomPan({
  viewportRef,
  CANVAS_W,
  CANVAS_H,
  undo,
  redo,
  deleteSelected,
  setSelected,
  pending,
  canvasPoint,
  placeTable,
  placeObject,
  setPending,
}: UseFloorPlanZoomPanOptions) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  const keyHandler = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      redo();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteSelected();
    } else if (e.key === 'Escape') {
      setSelected(null);
    }
  };

  useEffect(() => {
    keyHandlerRef.current = keyHandler;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function zoomAt(nextZoom: number, cx?: number, cy?: number) {
    const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect && cx !== undefined && cy !== undefined) {
      const px = cx - rect.left;
      const py = cy - rect.top;
      setPan((p) => ({ x: px - ((px - p.x) / zoom) * z, y: py - ((py - p.y) / zoom) * z }));
    }
    setZoom(z);
  }

  function fitToScreen() {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const z = clamp(Math.min(rect.width / CANVAS_W, rect.height / CANVAS_H) * 0.95, MIN_ZOOM, MAX_ZOOM);
    setZoom(z);
    setPan({ x: (rect.width - CANVAS_W * z) / 2, y: (rect.height - CANVAS_H * z) / 2 });
  }

  function onWheel(e: ReactWheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    zoomAt(zoom * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX, e.clientY);
  }

  function onViewportPointerDown(e: ReactPointerEvent) {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).dataset.canvas !== '1') return;
    if (pending) {
      const p = pending as { drag: string; typeId?: string; objectType?: string };
      const { x, y } = canvasPoint(e.clientX, e.clientY);
      if (p.drag === 'new-table' && p.typeId) placeTable(p.typeId, x, y);
      else if (p.objectType) placeObject(p.objectType, x, y);
      setPending(null);
      return;
    }
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    panRef.current = { startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y };
    setSelected(null);
  }

  function onViewportPointerMove(e: ReactPointerEvent) {
    const p = panRef.current;
    if (!p) return;
    setPan({ x: p.origX + (e.clientX - p.startX), y: p.origY + (e.clientY - p.startY) });
  }

  function onViewportPointerUp() {
    panRef.current = null;
  }

  return {
    zoom,
    pan,
    zoomAt,
    fitToScreen,
    onWheel,
    onViewportPointerDown,
    onViewportPointerMove,
    onViewportPointerUp,
  };
}
