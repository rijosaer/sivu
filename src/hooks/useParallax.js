import { useEffect, useRef } from "react";

/**
 * Applies a very subtle vertical parallax + fade to an element as the page
 * scrolls past it. Respects prefers-reduced-motion by staying static.
 *
 * @param {number} factor - how many pixels of translation per 100px scrolled
 *                          (kept small: 2-6 is a gentle, non-distracting drift)
 */
export default function useParallax(factor = 3) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    let ticking = false;

    function update() {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      // Progress: -1 (above viewport) ... 0 (centered) ... 1 (below viewport)
      const progress = (rect.top + rect.height / 2 - viewportH / 2) / viewportH;
      const translate = progress * factor * -10;
      el.style.transform = `translate3d(0, ${translate.toFixed(2)}px, 0)`;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [factor]);

  return ref;
}
