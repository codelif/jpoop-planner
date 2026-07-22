"use client";

import * as React from "react";

/**
 * Convert "HH:MM AM/PM" → total minutes from midnight.
 */
function timeToMinutes(timeStr) {
  const [time, meridiem] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Hook to measure schedule card positions and animate a timeline dot.
 *
 * IMPORTANT FIX:
 * - Multiple cards can share the same start/end time.
 * - We now track per-card offsets and compute activeIndex by dot position vs card offsets,
 *   instead of using a time→position map that collapses duplicates.
 */
export function useTimeline(timelineItems, cardRefs) {
  const lineRef = React.useRef(null);

  // Time tick positions (still useful for rendering labels)
  const positionsRef = React.useRef({});
  const lineHeightRef = React.useRef(500);

  // Per-card measured offsets for accurate "active" determination
  const cardOffsetsRef = React.useRef([]); // [{top,bottom}, ...]

  const [dotPosition, setDotPosition] = React.useState(0);
  const [activeIndex, setActiveIndex] = React.useState(null);

  const targetDotPosition = React.useRef(0);

  function findActiveCardByPosition(dotPos, offsetsArr) {
    for (let i = 0; i < offsetsArr.length; i++) {
      const off = offsetsArr[i];
      if (!off) continue;
      if (dotPos >= off.top && dotPos <= off.bottom) return i;
    }
    return null;
  }

  const measurePositions = React.useCallback(() => {
    if (!lineRef.current) return;

    const lineRect = lineRef.current.getBoundingClientRect();
    const timeMap = {};
    const offsets = [];

    // On mobile (< 768px), add padding to spread labels apart for card to fit
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const mobilePadding = isMobile ? 20 : 0;

    timelineItems.forEach((item, index) => {
      const cardEl = cardRefs[index]?.current;
      if (!cardEl) return;

      const cardRect = cardEl.getBoundingClientRect();
      const topOffset = cardRect.top - lineRect.top - mobilePadding;
      const bottomOffset = cardRect.bottom - lineRect.top + mobilePadding;

      offsets[index] = { top: topOffset, bottom: bottomOffset };

      // For time labels:
      // start time → take the MIN top among cards with that time
      if (item.start) {
        if (timeMap[item.start] == null) timeMap[item.start] = topOffset;
        else timeMap[item.start] = Math.min(timeMap[item.start], topOffset);
      }

      // end time → take the MAX bottom among cards with that time
      if (item.end) {
        if (timeMap[item.end] == null) timeMap[item.end] = bottomOffset;
        else timeMap[item.end] = Math.max(timeMap[item.end], bottomOffset);
      }
    });

    positionsRef.current = timeMap;
    cardOffsetsRef.current = offsets;

    const allBottoms = offsets.map((o) => o?.bottom).filter((v) => v != null);
    const allOffsets = [...Object.values(timeMap), ...allBottoms];
    if (allOffsets.length) {
      const maxPos = Math.max(...allOffsets);
      lineHeightRef.current = maxPos + 50;
    } else {
      lineHeightRef.current = 500;
    }
  }, [timelineItems, cardRefs]);

  const updateDotAndActive = React.useCallback(() => {
    const lineHeight = lineHeightRef.current;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    if (docHeight <= 0) {
      targetDotPosition.current = 0;
    } else {
      const scrollTop = window.scrollY || window.pageYOffset;
      const scrollProgress = Math.min(1, Math.max(0, scrollTop / docHeight));
      const usableHeight = lineHeight - 20;
      const newTop = 10 + scrollProgress * usableHeight;
      targetDotPosition.current = newTop;
    }

    const newActive = findActiveCardByPosition(
      targetDotPosition.current,
      cardOffsetsRef.current,
    );
    setActiveIndex(newActive);
  }, []);

  React.useEffect(() => {
    measurePositions();
    updateDotAndActive();
  }, [measurePositions, updateDotAndActive]);

  React.useEffect(() => {
    function onScroll() {
      updateDotAndActive();
    }
    function onResize() {
      measurePositions();
      updateDotAndActive();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [measurePositions, updateDotAndActive]);

  React.useEffect(() => {
    let animationFrameId;

    const animate = () => {
      setDotPosition((currentPos) => {
        const diff = targetDotPosition.current - currentPos;
        if (Math.abs(diff) < 0.5) {
          return targetDotPosition.current;
        }
        return currentPos + diff * 0.1;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  function isTimeWithinActiveCard(timeStr) {
    if (activeIndex == null) return false;
    const activeItem = timelineItems[activeIndex];
    if (!activeItem) return false;
    const tMin = timeToMinutes(timeStr);
    const startMin = timeToMinutes(activeItem.start);
    const endMin = timeToMinutes(activeItem.end);
    return tMin >= startMin && tMin <= endMin;
  }

  return {
    lineRef,
    dotPosition,
    activeIndex,
    isTimeWithinActiveCard,
    get lineHeight() {
      return lineHeightRef.current;
    },
    get positions() {
      return positionsRef.current;
    },
  };
}
