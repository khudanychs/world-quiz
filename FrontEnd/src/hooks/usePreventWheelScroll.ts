import { useEffect, RefObject } from "react";

/**
 * Hook to prevent page scroll when wheeling over an element.
 * Useful for map containers that have their own zoom controls.
 */
export function usePreventWheelScroll(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const onWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });
    
    return () => el.removeEventListener("wheel", onWheel as EventListener);
  }, [ref]);
}
