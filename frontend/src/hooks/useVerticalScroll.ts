import { useCallback, useRef } from "react";

/**
 * 縦書きコンテナ用スクロールフック。
 * writing-mode: vertical-rl ではホイールで横スクロールする必要があるため、
 * wheel イベントを deltaY → scrollLeft に変換する。
 */
export function useVerticalScroll() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    if (containerRef.current) {
      containerRef.current.removeEventListener("wheel", handleWheel);
    }
    containerRef.current = node;
    if (node) {
      node.addEventListener("wheel", handleWheel, { passive: false });
    }
  }, []);

  return { ref: callbackRef, containerRef };
}

function handleWheel(e: WheelEvent) {
  const el = e.currentTarget as HTMLDivElement;
  if (!el) return;

  // 縦書き(vertical-rl)ではscrollLeftが負になる
  // deltaYをscrollLeftに変換
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault();
    el.scrollLeft -= e.deltaY;
  }
}
