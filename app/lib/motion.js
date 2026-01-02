import React from "react";
import { motion, useMotionValue, animate } from "framer-motion";
// app/lib/motion.js
export const slideVariants = {
  enter: ({ direction, width }) => ({
    x: direction > 0 ? width : -width,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: ({ direction, width }) => ({
    x: direction > 0 ? -width : width,
    opacity: 0,
  }),
};

export function HorizontalSwipeMotion({
  disabled,
  onSwipeLeft,
  onSwipeRight,
  children,
  style,
  ...motionProps
}) {
  const x = useMotionValue(0);

  const ptr = React.useRef({
    id: null,
    mode: null, // null | "h" | "v"
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    dxRaw: 0,
  });

  const MIN_LOCK_PX = 8;
  const LOCK_RATIO = 1.2;
  const FLICK_VX = 0.75; // px/ms (~750px/s)

  const clampRubber = (dx, w) => {
    // 1:1 until ~35% screen, then rubber-band
    const max = w * 0.35;
    if (dx > max) return max + (dx - max) * 0.2;
    if (dx < -max) return -max + (dx + max) * 0.2;
    return dx;
  };

  const resetPointer = () => {
    ptr.current.id = null;
    ptr.current.mode = null;
    ptr.current.dxRaw = 0;
  };

  const onPointerDown = (e) => {
    if (disabled) return;
    if (ptr.current.id != null) return;

    // Only treat touch/pen as "touch gesture"
    if (e.pointerType !== "touch" && e.pointerType !== "pen") return;

    ptr.current.id = e.pointerId;
    ptr.current.mode = null;
    ptr.current.startX = e.clientX;
    ptr.current.startY = e.clientY;
    ptr.current.lastX = e.clientX;
    ptr.current.lastT = performance.now();
    ptr.current.dxRaw = 0;

    // stop any snap-back animation currently running
    x.stop?.();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e) => {
    if (ptr.current.id !== e.pointerId) return;

    const now = performance.now();
    const dx = e.clientX - ptr.current.startX;
    const dy = e.clientY - ptr.current.startY;

    // Update velocity basis
    ptr.current.lastX = e.clientX;
    ptr.current.lastT = now;
    ptr.current.dxRaw = dx;

    // Decide if this gesture is horizontal or vertical (once)
    if (!ptr.current.mode) {
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);

      if (ax < MIN_LOCK_PX && ay < MIN_LOCK_PX) return;

      if (ax > ay * LOCK_RATIO) ptr.current.mode = "h";
      else ptr.current.mode = "v";
    }

    // If horizontal, we own it: prevent default + update x (1:1)
    if (ptr.current.mode === "h") {
      if (e.cancelable) e.preventDefault();

      const w = window.innerWidth || 360;
      x.set(clampRubber(dx, w));
    }
  };

  const onPointerUp = (e) => {
    if (ptr.current.id !== e.pointerId) return;

    const mode = ptr.current.mode;
    const dxRaw = ptr.current.dxRaw;

    // If it wasn't horizontal, do nothing (let scroll be scroll)
    if (mode !== "h") {
      resetPointer();
      return;
    }

    const w = window.innerWidth || 360;
    const threshold = w * 0.22;

    // Approximate release velocity using last segment
    const now = performance.now();
    const dt = Math.max(1, now - ptr.current.lastT);
    const vx = (e.clientX - ptr.current.lastX) / dt;

    const flick = Math.abs(vx) > FLICK_VX;

    const goNext = dxRaw < -threshold || (flick && vx < 0);
    const goPrev = dxRaw > threshold || (flick && vx > 0);

    if (goNext) {
      onSwipeLeft?.();
      // do NOT snap x back — exit variant will take over
    } else if (goPrev) {
      onSwipeRight?.();
    } else {
      animate(x, 0, { type: "tween", duration: 0.18, ease: "easeOut" });
    }

    resetPointer();
  };

  const onPointerCancel = (e) => {
    if (ptr.current.id !== e.pointerId) return;
    animate(x, 0, { type: "tween", duration: 0.18, ease: "easeOut" });
    resetPointer();
  };

  return (
    <motion.div
      {...motionProps}
      style={{
        ...style,
        x,
        touchAction: "pan-y",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {children}
    </motion.div>
  );
}
