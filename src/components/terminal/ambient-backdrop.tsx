import { useEffect, useRef } from "react";

/**
 * Fixed, full-viewport ambient layer: obsidian base, drifting gold/azure/emerald
 * orbs, a gold glassmorphism light sweep, a masked grid, film grain and a
 * vignette. A faint gold torch also tracks the pointer on fine-pointer devices.
 *
 * Everything here is decorative, so it is `aria-hidden`, `pointer-events-none`
 * and sits at `-z-10`, behind all page content.
 */
export function AmbientBackdrop() {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = cursor.current;
    if (!node) return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let x = window.innerWidth * 0.5;
    let y = window.innerHeight * 0.12;

    const paint = () => {
      frame = 0;
      node.style.setProperty("--kx-x", `${x}px`);
      node.style.setProperty("--kx-y", `${y}px`);
    };

    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="kx-ambient">
      <div className="kx-ambient__base" />
      <div className="kx-orb kx-orb--gold" />
      <div className="kx-orb kx-orb--azure" />
      <div className="kx-orb kx-orb--emerald" />
      <div className="kx-streak" />
      <div className="kx-grid" />
      <div ref={cursor} className="kx-cursor" />
      <div className="kx-noise" />
      <div className="kx-vignette" />
    </div>
  );
}
