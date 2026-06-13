"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

/* ── types ─────────────────────────────────────────────────────────── */

interface TimelineEntry {
  id: string;
  date: string;
}
interface Props {
  entries: TimelineEntry[];
}

interface MonthStop {
  id: string;
  month: string;
  count: number;
  year: number;
  flatIdx: number;
}

interface YearGroup {
  year: number;
  months: MonthStop[];
}

/* ── data helpers ──────────────────────────────────────────────────── */

function buildGroups(entries: TimelineEntry[]): {
  flat: MonthStop[];
  groups: YearGroup[];
} {
  const flat: MonthStop[] = [];
  let prev = "";

  for (const e of entries) {
    const d = new Date(e.date);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    const key = `${month}-${year}`;

    if (key === prev) {
      flat[flat.length - 1].count++;
    } else {
      flat.push({ id: e.id, month, year, count: 1, flatIdx: flat.length });
      prev = key;
    }
  }

  const map = new Map<number, MonthStop[]>();
  for (const s of flat) {
    if (!map.has(s.year)) map.set(s.year, []);
    map.get(s.year)!.push(s);
  }

  const groups: YearGroup[] = [];
  for (const [year, months] of map) {
    groups.push({ year, months });
  }

  return { flat, groups };
}

/* ── component ─────────────────────────────────────────────────────── */

export default function TimelineBar({ entries }: Props) {
  const { flat, groups } = useMemo(() => buildGroups(entries), [entries]);
  const N = flat.length;
  const isCompact = N <= 8;
  const compactHeight = Math.max(
    150,
    Math.min(420, groups.length * 34 + N * 36),
  );

  /* refs for DOM-direct updates (zero React re-renders during scroll) */
  const rootRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const yearRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isDragging = useRef(false);
  const rafId = useRef(0);
  const cardTops = useRef<number[]>([]);
  const prevActive = useRef(-1);
  const prevYearIdx = useRef(-1);
  const suppressClick = useRef(false);
  const lastMeasureAt = useRef(0);
  const measureRetryCount = useRef(0);

  /* Smooth lerp state for pill */
  const currentPillY = useRef(0);
  const targetPillY = useRef(0);
  const lerpRafId = useRef(0);
  const lerpRunning = useRef(false);

  /* ── measure card positions ── */
  const measureCards = useCallback(
    (force = false) => {
      const now = performance.now();
      if (!force && now - lastMeasureAt.current < 120) return;
      lastMeasureAt.current = now;

      let foundCount = 0;
      const nextTops = flat.map((s, index) => {
        const el = document.getElementById(s.id);
        if (!el) return cardTops.current[index] ?? 0;
        foundCount++;
        return (
          el.getBoundingClientRect().top +
          window.scrollY -
          window.innerHeight * 0.28
        );
      });

      cardTops.current =
        foundCount === 0 || nextTops.every((top) => top === 0)
          ? cardTops.current
          : nextTops;
    },
    [flat],
  );

  /* ── float index from scrollY ── */
  const getFloat = useCallback(
    (scrollY: number) => {
      const t = cardTops.current;
      if (N <= 1) return 0;
      if (t.length < N || t.some((top) => !Number.isFinite(top))) return 0;
      if (scrollY <= t[0]) return 0;
      if (scrollY >= t[N - 1]) return N - 1;

      let lo = 0;
      let hi = N - 1;
      while (lo < hi - 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (scrollY >= t[mid]) lo = mid;
        else hi = mid;
      }

      const i = lo;
      const range = t[i + 1] - t[i];
      return (
        i + (range > 0 ? Math.max(0, Math.min(1, (scrollY - t[i]) / range)) : 0)
      );
    },
    [N],
  );

  /* ── get pill Y from float index using actual button positions ── */
  const getPillY = useCallback(
    (floatIdx: number): number => {
      const btns = monthRefs.current;
      if (N === 0) return 0;
      if (N === 1) {
        const btn = btns[0];
        if (!btn || !rootRef.current) return 0;
        const rRect = rootRef.current.getBoundingClientRect();
        const bRect = btn.getBoundingClientRect();
        return bRect.top - rRect.top + bRect.height / 2;
      }

      const clamped = Math.max(0, Math.min(N - 1, floatIdx));
      const lo = Math.floor(clamped);
      const hi = Math.min(lo + 1, N - 1);
      const frac = clamped - lo;

      const btnLo = btns[lo];
      const btnHi = btns[hi];
      if (!btnLo || !btnHi || !rootRef.current) return 0;

      const rRect = rootRef.current.getBoundingClientRect();
      const loRect = btnLo.getBoundingClientRect();
      const hiRect = btnHi.getBoundingClientRect();

      const yLo = loRect.top - rRect.top + loRect.height / 2;
      const yHi = hiRect.top - rRect.top + hiRect.height / 2;
      return yLo + frac * (yHi - yLo);
    },
    [N],
  );

  /* ── lerp animation loop for buttery-smooth pill ── */
  const startLerp = useCallback(() => {
    if (lerpRunning.current) return;
    lerpRunning.current = true;

    const tick = () => {
      const diff = targetPillY.current - currentPillY.current;
      // Lerp factor — higher = more responsive
      const factor = 0.22;

      if (Math.abs(diff) < 0.3) {
        // Snap when close enough
        currentPillY.current = targetPillY.current;
        if (pillRef.current) {
          pillRef.current.style.transform = `translateY(${currentPillY.current}px) translateY(-50%)`;
        }
        lerpRunning.current = false;
        return;
      }

      currentPillY.current += diff * factor;
      if (pillRef.current) {
        pillRef.current.style.transform = `translateY(${currentPillY.current}px) translateY(-50%)`;
      }

      lerpRafId.current = requestAnimationFrame(tick);
    };

    lerpRafId.current = requestAnimationFrame(tick);
  }, []);

  /* ── apply visuals directly to DOM ── */
  const applyVisuals = useCallback(
    (floatIdx: number) => {
      if (!pillRef.current || N === 0) return;

      const activeIdx = Math.max(
        0,
        Math.min(N - 1, Math.floor(floatIdx + 0.5)),
      );
      const activeYear = flat[activeIdx]?.year ?? 0;
      const activeYearGroupIdx = groups.findIndex((g) => g.year === activeYear);
      const newPillY = getPillY(activeIdx);

      if (
        newPillY === 0 &&
        monthRefs.current[activeIdx] &&
        measureRetryCount.current < 4
      ) {
        measureRetryCount.current += 1;
        requestAnimationFrame(() => applyVisuals(floatIdx));
      } else {
        measureRetryCount.current = 0;
      }

      targetPillY.current = newPillY;

      if (
        !lerpRunning.current &&
        Math.abs(newPillY - currentPillY.current) > 0.3
      ) {
        startLerp();
      } else if (!lerpRunning.current) {
        startLerp();
      }

      // Update month labels + dots (always update to avoid stuck states)
      if (activeIdx !== prevActive.current) {
        prevActive.current = activeIdx;
        for (let i = 0; i < N; i++) {
          const btn = monthRefs.current[i];
          const dot = dotRefs.current[i];
          if (!btn || !dot) continue;
          const isActive = i === activeIdx;
          btn.dataset.state = isActive ? "active" : "idle";
          dot.dataset.state = isActive ? "active" : "idle";
        }
      }

      // Update year group focus
      if (activeYearGroupIdx !== prevYearIdx.current) {
        prevYearIdx.current = activeYearGroupIdx;
        for (let g = 0; g < groups.length; g++) {
          const el = yearRefs.current[g];
          if (!el) continue;
          el.dataset.focus = g === activeYearGroupIdx ? "true" : "false";
        }
      }
    },
    [N, flat, groups, getPillY, startLerp],
  );

  /* ── scroll listener (rAF-throttled) ── */
  useEffect(() => {
    measureCards(true);

    const onResize = () => {
      measureCards(true);
      // Re-apply visuals after remeasure to fix stuck pill
      requestAnimationFrame(() => {
        const f = getFloat(window.scrollY);
        applyVisuals(f);
      });
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("timeline-measure", onResize);

    const resizeObserver = new ResizeObserver(() => onResize());
    flat.forEach((stop) => {
      const el = document.getElementById(stop.id);
      if (el) resizeObserver.observe(el);
    });

    const onScroll = () => {
      if (isDragging.current) return;
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        measureCards();
        applyVisuals(getFloat(window.scrollY));
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // Initial paint (immediate + delayed for images)
    requestAnimationFrame(() => {
      const f = getFloat(window.scrollY);
      // Set initial pill position instantly (no lerp for first paint)
      const initialY = getPillY(f);
      currentPillY.current = initialY;
      targetPillY.current = initialY;
      if (pillRef.current) {
        pillRef.current.style.transform = `translateY(${initialY}px) translateY(-50%)`;
      }
      applyVisuals(f);
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        measureCards(true);
        applyVisuals(getFloat(window.scrollY));
      });
    });
    const t = setTimeout(() => {
      measureCards(true);
      const f = getFloat(window.scrollY);
      applyVisuals(f);
    }, 600);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("timeline-measure", onResize);
      resizeObserver.disconnect();
      clearTimeout(t);
      cancelAnimationFrame(rafId.current);
      cancelAnimationFrame(lerpRafId.current);
    };
  }, [measureCards, getFloat, applyVisuals, getPillY]);

  /* ── pointer / drag ── */
  const getIdxFromY = useCallback(
    (clientY: number): number => {
      const btns = monthRefs.current;
      if (!rootRef.current || !btns[0] || !btns[N - 1]) return 0;

      const rootRect = rootRef.current.getBoundingClientRect();
      const firstRect = btns[0]!.getBoundingClientRect();
      const lastRect = btns[N - 1]!.getBoundingClientRect();

      const topPx = firstRect.top - rootRect.top + firstRect.height / 2;
      const botPx = lastRect.top - rootRect.top + lastRect.height / 2;

      const localY = clientY - rootRect.top;
      if (botPx === topPx) return 0;
      const t = Math.max(0, Math.min(1, (localY - topPx) / (botPx - topPx)));
      return t * (N - 1);
    },
    [N],
  );

  const scrollToFloat = useCallback(
    (fIdx: number) => {
      const t = cardTops.current;
      if (N <= 1) {
        window.scrollTo({ top: t[0] ?? 0, behavior: "auto" });
        return;
      }
      const i = Math.floor(Math.min(fIdx, N - 2));
      const frac = fIdx - i;
      window.scrollTo({
        top: t[i] + frac * ((t[i + 1] ?? t[i]) - t[i]),
        behavior: "auto",
      });
    },
    [N],
  );

  const dragStartY = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      rootRef.current?.setPointerCapture?.(e.pointerId);
      isDragging.current = true;
      suppressClick.current = false;
      dragStartY.current = e.clientY;
      measureCards(true);
      const idx = getIdxFromY(e.clientY);
      scrollToFloat(idx);
      applyVisuals(idx);
    },
    [measureCards, getIdxFromY, scrollToFloat, applyVisuals],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      if (Math.abs(e.clientY - dragStartY.current) > 4) {
        suppressClick.current = true;
      }
      const idx = getIdxFromY(e.clientY);
      scrollToFloat(idx);
      applyVisuals(idx);
    },
    [getIdxFromY, scrollToFloat, applyVisuals],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      rootRef.current?.releasePointerCapture?.(e.pointerId);
      isDragging.current = false;
      // After drag ends, re-sync from current scroll position
      requestAnimationFrame(() => {
        measureCards();
        applyVisuals(getFloat(window.scrollY));
      });
    },
    [measureCards, getFloat, applyVisuals],
  );

  const handleClick = useCallback(
    (id: string) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      const el = document.getElementById(id);
      if (el) {
        measureCards(true);
        window.scrollTo({
          top:
            el.getBoundingClientRect().top +
            window.scrollY -
            window.innerHeight * 0.28,
          behavior: "smooth",
        });
      }
    },
    [measureCards],
  );

  if (N === 0) return null;

  return (
    <>
      <style>{`
        /* ── Aesthetic Glass UI ── */
        .tl-root {
          --tl-fg: #1d1d1f;
          --tl-fg-dim: #86868b;
          --tl-dot: #c7c7cc;
          --tl-dot-active: #1d1d1f;
          --tl-year: #86868b;
          --tl-year-active: #1d1d1f;
          --tl-pill-bg: rgba(0, 0, 0, 0.05);
          --tl-pill-border: rgba(0, 0, 0, 0.03);
          --tl-pill-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
          --tl-separator: rgba(0, 0, 0, 0.08);
          --tl-backdrop-blur: 16px;
        }
        .dark .tl-root {
          --tl-fg: #f5f5f7;
          --tl-fg-dim: #a1a1a6;
          --tl-dot: #636366;
          --tl-dot-active: #ffffff;
          --tl-year: #a1a1a6;
          --tl-year-active: #ffffff;
          --tl-pill-bg: rgba(255, 255, 255, 0.14);
          --tl-pill-border: rgba(255, 255, 255, 0.24);
          --tl-pill-shadow: 0 4px 20px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          --tl-separator: rgba(255, 255, 255, 0.12);
          --tl-backdrop-blur: 24px;
        }

        /* ── Hover popup effect ── */
        .tl-root {
          opacity: 0.92;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                      filter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          filter: blur(0px);
        }
        .tl-root:hover {
          opacity: 1;
          filter: blur(0px);
        }

        /* ── Smooth transitions ── */
        .tl-ease { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

        /* ── Month labels ── */
        .tl-month[data-state="active"] {
          color: var(--tl-fg);
          font-weight: 600;
          opacity: 1;
        }
        .tl-month[data-state="idle"] {
          color: var(--tl-fg-dim);
          font-weight: 400;
          opacity: 0.6;
        }

        /* ── Dots ── */
        .tl-dot[data-state="active"] {
          width: 8px; height: 8px;
          background: var(--tl-dot-active);
          box-shadow: 0 0 0 3px rgba(120, 120, 128, 0.16);
        }
        .tl-dot[data-state="idle"] {
          width: 6px; height: 6px;
          background: var(--tl-dot);
          box-shadow: none;
        }

        /* ── Year group focus ── */
        .tl-year-group[data-focus="true"]  { opacity: 1; }
        .tl-year-group[data-focus="false"] { opacity: 0.35; }
      `}</style>

      <div
        ref={rootRef}
        className="tl-root fixed top-28 right-4 z-20 hidden cursor-grab touch-none flex-col items-end select-none active:cursor-grabbing lg:flex"
        style={{
          width: 240,
          height: isCompact ? compactHeight : "calc(100vh - 200px)",
          minHeight: isCompact ? compactHeight : 400,
          maxHeight: "calc(100vh - 200px)",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* ── Sliding glass pill highlight ── */}
        <div
          ref={pillRef}
          className="pointer-events-none absolute"
          style={{
            right: 4,
            width: 184,
            height: 36,
            background: "var(--tl-pill-bg)",
            backdropFilter: "blur(var(--tl-backdrop-blur)) saturate(1.8)",
            WebkitBackdropFilter: "blur(var(--tl-backdrop-blur)) saturate(1.8)",
            border: "1px solid var(--tl-pill-border)",
            borderRadius: 12,
            boxShadow: "var(--tl-pill-shadow)",
            willChange: "transform",
          }}
        />

        {/* ── Year-grouped items (grid style) ── */}
        <div className="relative flex h-full w-full flex-col justify-between py-5">
          {groups.map((g, gi) => (
            <div
              key={g.year}
              ref={(el) => {
                yearRefs.current[gi] = el;
              }}
              className="tl-year-group tl-ease flex min-h-0 flex-col"
              style={{ flexGrow: g.months.length || 1 }}
              data-focus={gi === 0 ? "true" : "false"}
            >
              {/* Year header */}
              <div
                className="flex items-center justify-end pr-4"
                style={{ gap: 10 }}
              >
                <span
                  className="tl-ease"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    color: "var(--tl-year)",
                  }}
                >
                  {g.year}
                </span>
                <div
                  style={{
                    width: "28px",
                    height: 1,
                    background: "var(--tl-separator)",
                  }}
                />
              </div>

              {/* Month entries */}
              <div className="flex min-h-0 flex-1 flex-col justify-evenly overflow-hidden">
                {g.months.map((m) => (
                  <button
                    key={m.id}
                    ref={(el) => {
                      monthRefs.current[m.flatIdx] = el;
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick(m.id);
                    }}
                    className="tl-month tl-ease relative flex cursor-pointer items-center justify-end pr-3"
                    data-state={m.flatIdx === 0 ? "active" : "idle"}
                    style={{
                      fontSize: "max(10px, min(1.2vh, 13px))",
                      lineHeight: 1,
                      padding:
                        "max(2px, min(0.6vh, 8px)) 18px max(2px, min(0.6vh, 8px)) 0",
                      gap: 10,
                      background: "none",
                      border: "none",
                      minHeight: 0,
                    }}
                  >
                    {/* Month label */}
                    <span
                      className="whitespace-nowrap"
                      style={{ fontFamily: "inherit" }}
                    >
                      {m.month}
                    </span>

                    {/* Dot */}
                    <div
                      ref={(el) => {
                        dotRefs.current[m.flatIdx] = el;
                      }}
                      className="tl-dot tl-ease shrink-0 rounded-full"
                      data-state={m.flatIdx === 0 ? "active" : "idle"}
                    />
                  </button>
                ))}
              </div>

              {/* Separator between year groups */}
              {gi < groups.length - 1 && (
                <div className="shrink-0" style={{ height: "1vh" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
