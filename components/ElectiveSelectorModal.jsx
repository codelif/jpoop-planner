"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ELECTIVE_NONE } from "@/app/lib/electives";
import { slideVariants, HorizontalSwipeMotion } from "@/app/lib/motion";
import { AnimatePresence } from "framer-motion";

export function ElectiveSelectorModal({
  open,
  onOpenChange,
  electivesByCategory = {},
  selected = {},
  onSelect,
  electiveNamesByCode = {},
}) {
  // ---- stable hooks order (no early return before hooks) ----
  const categories = React.useMemo(() => {
    const list = Object.keys(electivesByCategory || {});
    list.sort((a, b) => a.localeCompare(b));
    return list;
  }, [electivesByCategory]);

  const hasCategories = categories.length > 0;

  const [activeCategory, setActiveCategory] = React.useState("");
  const [query, setQuery] = React.useState("");

  const lastActiveRef = React.useRef("");

  const safeActiveIndex = React.useMemo(() => {
    if (!hasCategories) return 0;
    const idx = categories.indexOf(activeCategory);
    return idx >= 0 ? idx : 0;
  }, [hasCategories, categories, activeCategory]);

  const safeActiveCategory = hasCategories ? categories[safeActiveIndex] : "";

  const selectedCount = React.useMemo(() => {
    if (!hasCategories) return 0;
    return categories.reduce((acc, cat) => {
      const v = selected?.[cat];
      return acc + (v && v !== ELECTIVE_NONE ? 1 : 0);
    }, 0);
  }, [hasCategories, categories, selected]);

  const currentValue = hasCategories
    ? (selected?.[safeActiveCategory] ?? ELECTIVE_NONE)
    : ELECTIVE_NONE;

  const allOptionsForActive = React.useMemo(() => {
    if (!hasCategories) return [];
    const raw = electivesByCategory?.[safeActiveCategory];
    return Array.isArray(raw) ? raw.slice() : [];
  }, [hasCategories, electivesByCategory, safeActiveCategory]);

  const filteredOptions = React.useMemo(() => {
    if (!hasCategories) return [];
    const q = query.trim().toLowerCase();
    if (!q) return allOptionsForActive;

    return allOptionsForActive.filter((code) => {
      const name = electiveNamesByCode?.[code] || "";
      return (
        String(code).toLowerCase().includes(q) ||
        String(name).toLowerCase().includes(q)
      );
    });
  }, [hasCategories, allOptionsForActive, query, electiveNamesByCode]);

  // When opened, init active category & reset search
  React.useEffect(() => {
    if (!open) return;

    if (!hasCategories) {
      setActiveCategory("");
      setQuery("");
      return;
    }

    const initial =
      lastActiveRef.current && categories.includes(lastActiveRef.current)
        ? lastActiveRef.current
        : categories[0];

    setActiveCategory(initial);
    setQuery("");
  }, [open, hasCategories, categories]);

  // remember last active category
  React.useEffect(() => {
    if (!open && activeCategory) {
      lastActiveRef.current = activeCategory;
    }
  }, [open, activeCategory]);

  const normalizeLabel = (code) => {
    if (code === ELECTIVE_NONE) return "None";
    return electiveNamesByCode?.[code] ? electiveNamesByCode[code] : code;
  };

  const normalizeSecondary = (code) => {
    if (code === ELECTIVE_NONE) return "Hide electives from this category";
    const name = electiveNamesByCode?.[code];
    return name ? code : "";
  };

  const setValue = (cat, value) => {
    onSelect?.(cat, value);
  };

  const goToCategory = (idx) => {
    if (!hasCategories) return;
    const clamped = Math.max(0, Math.min(categories.length - 1, idx));
    setActiveCategory(categories[clamped]);
    setQuery("");
  };

  function useViewportWidth() {
    const [w, setW] = React.useState(() =>
      typeof window !== "undefined" ? window.innerWidth : 360,
    );

    React.useEffect(() => {
      const onResize = () => setW(window.innerWidth);
      window.addEventListener("resize", onResize, { passive: true });
      return () => window.removeEventListener("resize", onResize);
    }, []);

    return w;
  }

  const viewportW = useViewportWidth();
  const [slideDirection, setSlideDirection] = useState(0);

  const goPrev = () => {
    if (safeActiveIndex === 0) return false;
    setSlideDirection(-1);
    goToCategory(safeActiveIndex - 1);
    return true;
  };

  const goNext = () => {
    if (safeActiveIndex === categories.length - 1) return false;
    setSlideDirection(1);
    goToCategory(safeActiveIndex + 1);
    return true;
  };

  const hideAll = () => {
    if (!hasCategories) return;
    for (const cat of categories) setValue(cat, ELECTIVE_NONE);
  };

  const OptionRow = ({ value }) => {
    const isActive = currentValue === value;
    const primary = normalizeLabel(value);
    const secondary = normalizeSecondary(value);

    return (
      <button
        type="button"
        onClick={() => {
          if (!hasCategories) return;
          setValue(safeActiveCategory, value);
        }}
        className={[
          "w-full text-left rounded-xl border transition-colors",
          "px-4 py-3 min-h-[56px]",
          "flex items-center gap-3",
          isActive
            ? "border-primary bg-primary/10"
            : "border-border bg-background hover:bg-accent/40",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        ].join(" ")}
        role="radio"
        aria-checked={isActive}
        disabled={!hasCategories}
      >
        <div className="shrink-0">
          {isActive ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground break-words">
            {primary}
          </div>
          {secondary ? (
            <div className="text-xs text-muted-foreground mt-0.5 break-words">
              {secondary}
            </div>
          ) : null}
        </div>
      </button>
    );
  };

  const DesktopCategoryItem = ({ cat, idx }) => {
    const val = selected?.[cat] ?? ELECTIVE_NONE;
    const isHere = cat === safeActiveCategory;

    const label =
      val === ELECTIVE_NONE
        ? "None"
        : electiveNamesByCode?.[val]
          ? `${electiveNamesByCode[val]} (${val})`
          : val;

    return (
      <button
        type="button"
        onClick={() => goToCategory(idx)}
        className={[
          "w-full text-left rounded-xl border px-3 py-2 transition-colors",
          isHere
            ? "border-primary bg-primary/10"
            : "border-border hover:bg-accent/40",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-sm text-foreground break-words">
            {cat}
          </div>
          <div className="text-[11px] text-muted-foreground shrink-0">
            {idx + 1}/{categories.length}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1 break-words">
          {label}
        </div>
      </button>
    );
  };

  // after hooks: if no categories, render nothing
  if (!hasCategories) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]" />

        <Dialog.Content
          className={[
            "fixed z-[9999] bg-popover border border-border shadow-xl overflow-hidden focus:outline-none",
            "flex flex-col",

            // Mobile: real height + bottom sheet
            "left-0 right-0 bottom-0 top-auto w-full h-[92vh] max-h-[92vh] rounded-t-2xl",

            // Desktop: centered
            "md:left-1/2 md:top-1/2 md:bottom-auto md:right-auto",
            "md:-translate-x-1/2 md:-translate-y-1/2",
            "md:w-[min(980px,calc(100vw-32px))]",
            "md:h-auto md:max-h-[min(85vh,860px)]",
            "md:rounded-2xl",
          ].join(" ")}
        >
          {/* Header */}
          <div
            className={[
              "shrink-0 bg-popover/85 backdrop-blur-sm border-b border-border",
              "px-4 md:px-5",
              "pt-[calc(env(safe-area-inset-top)+14px)] md:pt-4 pb-4",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Dialog.Title className="text-lg font-bold text-foreground">
                  Choose electives
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mt-1">
                  Category {safeActiveIndex + 1} of {categories.length} •{" "}
                  {selectedCount} selected
                </Dialog.Description>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange?.(false)}
                className={[
                  "h-10 w-10 rounded-full border border-border shrink-0",
                  "inline-flex items-center justify-center bg-background hover:bg-accent transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                ].join(" ")}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile stepper */}
            <div className="mt-4 md:hidden">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-3"
                  onClick={goPrev}
                  disabled={safeActiveIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>

                <div className="flex-1 min-w-0 text-center">
                  <div className="text-sm font-semibold text-foreground break-words">
                    {safeActiveCategory}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Drag the options left/right to change category
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-3"
                  onClick={goNext}
                  disabled={safeActiveIndex === categories.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions (side-by-side on mobile) */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-full sm:w-auto"
                onClick={hideAll}
              >
                Hide all electives
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-full sm:w-auto"
                onClick={() => setQuery("")}
              >
                Clear search
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 flex md:flex-row">
            {/* Desktop category rail */}
            <div className="hidden md:flex md:w-[320px] border-r border-border bg-background/30 flex-col min-h-0">
              <div className="p-4 shrink-0">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Categories
                </div>
              </div>
              <div className="px-3 pb-4 overflow-auto flex-1 min-h-0 space-y-2">
                {categories.map((cat, idx) => (
                  <DesktopCategoryItem key={cat} cat={cat} idx={idx} />
                ))}
              </div>
            </div>

            {/* Options panel */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              {/* Desktop title row */}
              <div className="hidden md:block px-5 pt-5 shrink-0">
                <div className="text-lg font-bold text-foreground break-words">
                  {safeActiveCategory}
                </div>
                <div className="text-sm text-muted-foreground mt-1 break-words">
                  Selected:{" "}
                  <span className="font-medium text-foreground">
                    {currentValue === ELECTIVE_NONE
                      ? "None"
                      : electiveNamesByCode?.[currentValue]
                        ? `${electiveNamesByCode[currentValue]} (${currentValue})`
                        : currentValue}
                  </span>
                </div>
              </div>

              <AnimatePresence
                initial={false}
                custom={{ direction: slideDirection, width: viewportW }}
                mode="sync"
              >
                <div className="relative flex-1 min-h-0 overflow-hidden">
                  <HorizontalSwipeMotion
                    key={safeActiveCategory}
                    // disabled={showSkeleton || tableMode}
                    custom={{ direction: slideDirection, width: viewportW }}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "tween", duration: 0.3, ease: "easeInOut" },
                      opacity: { duration: 0.2 },
                    }}
                    onSwipeLeft={goNext}
                    onSwipeRight={goPrev}
                    className="absolute inset-0 flex flex-col min-h-0"
                  >
                    {/* Swipe + Search + List wrapper */}
                    <div className="flex-1 min-h-0 flex flex-col">
                      {/* Search bar */}
                      <div
                        className="px-4 md:px-5 pt-4 md:pt-4 shrink-0"
                        style={{
                          willChange: "transform",
                        }}
                      >
                        <div className="relative">
                          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by code or name"
                            inputMode="search"
                            className={[
                              "w-full h-11 rounded-xl border border-input bg-background pl-9 pr-3 text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            ].join(" ")}
                          />
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          {query.trim()
                            ? `Showing ${filteredOptions.length} match${
                                filteredOptions.length === 1 ? "" : "es"
                              }`
                            : `Showing ${allOptionsForActive.length} option${
                                allOptionsForActive.length === 1 ? "" : "s"
                              }`}
                        </div>
                      </div>

                      {/* List (always visible on mobile, scrolls properly) */}
                      <div
                        className={[
                          "flex-1 min-h-0 overflow-auto",
                          "px-4 md:px-5 py-4 space-y-2",
                          "overscroll-contain",
                        ].join(" ")}
                        role="radiogroup"
                        aria-label={`Options for ${safeActiveCategory}`}
                        style={{
                          willChange: "transform",
                          WebkitOverflowScrolling: "touch",
                        }}
                      >
                        <OptionRow value={ELECTIVE_NONE} />

                        {filteredOptions.length === 0 ? (
                          <div className="mt-2 rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                            No results. Try a different search.
                          </div>
                        ) : (
                          filteredOptions.map((code) => (
                            <OptionRow key={code} value={code} />
                          ))
                        )}

                        {/* extra space so last option never sits under the footer on mobile */}
                        <div
                          className="flex-1 min-h-0 overflow-auto px-4 md:px-5 py-4 space-y-2 overscroll-contain"
                          style={{
                            willChange: "transform",
                            WebkitOverflowScrolling: "touch",
                            paddingBottom:
                              "calc(env(safe-area-inset-bottom) + 96px)",
                          }}
                        />
                      </div>
                    </div>
                  </HorizontalSwipeMotion>
                </div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div
            className={[
              "shrink-0 bg-popover/85 backdrop-blur-sm border-t border-border",
              "px-4 md:px-5 py-4",
              "pb-[calc(env(safe-area-inset-bottom)+14px)] md:pb-4",
              "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
            ].join(" ")}
          >
            <div className="text-xs text-muted-foreground">
              Picks are saved instantly. Use None to hide electives in a
              category.
            </div>

            <Button
              variant="outline"
              className="h-11 sm:h-9 w-full sm:w-auto"
              onClick={() => onOpenChange?.(false)}
            >
              Done
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
