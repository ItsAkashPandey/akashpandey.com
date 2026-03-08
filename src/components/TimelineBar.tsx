"use client";

import { useCallback, useEffect, useRef } from "react";

/* ── types ─────────────────────────────────────────────────────────── */

interface TimelineEntry { id: string; date: string }
interface Props { entries: TimelineEntry[] }

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

function buildGroups(entries: TimelineEntry[]): { flat: MonthStop[]; groups: YearGroup[] } {
    const flat: MonthStop[] = [];
    let prev = "";

    for (const e of entries) {
        const d = new Date(e.date);
        const month = d.toLocaleDateString("en-US", { month: "short" });
        const year = d.getFullYear();
        const key = `${month}-${year}`;

        // We still increment count if there are multiple activities in the same month
        // but the user requested removing the "number badge" feature visually from the timeline
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
    const { flat, groups } = buildGroups(entries);
    const N = flat.length;

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
    const isHovering = useRef(false);
    const suppressClick = useRef(false);

    /* Smooth lerp state for pill */
    const currentPillY = useRef(0);
    const targetPillY = useRef(0);
    const lerpRafId = useRef(0);
    const lerpRunning = useRef(false);

    /* ── measure card positions ── */
    const measureCards = useCallback(() => {
        cardTops.current = flat.map((s) => {
            const el = document.getElementById(s.id);
            return el ? el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.25 : 0;
        });
    }, [flat]);

    /* ── float index from scrollY ── */
    const getFloat = useCallback((scrollY: number) => {
        const t = cardTops.current;
        if (N <= 1) return 0;
        if (scrollY <= t[0]) return 0;
        if (scrollY >= t[N - 1]) return N - 1;
        let i = 0;
        while (i < N - 1 && scrollY > t[i + 1]) i++;
        const range = t[i + 1] - t[i];
        return i + (range > 0 ? Math.max(0, Math.min(1, (scrollY - t[i]) / range)) : 0);
    }, [N]);

    /* ── get pill Y from float index using actual button positions ── */
    const getPillY = useCallback((floatIdx: number): number => {
        const btns = monthRefs.current;
        if (N === 0) return 0;
        if (N === 1) {
            const btn = btns[0];
            if (!btn || !rootRef.current) return 0;
            const rRect = rootRef.current.getBoundingClientRect();
            const bRect = btn.getBoundingClientRect();
            return (bRect.top - rRect.top) + bRect.height / 2;
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

        const yLo = (loRect.top - rRect.top) + loRect.height / 2;
        const yHi = (hiRect.top - rRect.top) + hiRect.height / 2;
        return yLo + frac * (yHi - yLo);
    }, [N]);

    /* ── lerp animation loop for buttery-smooth pill ── */
    const startLerp = useCallback(() => {
        if (lerpRunning.current) return;
        lerpRunning.current = true;

        const tick = () => {
            const diff = targetPillY.current - currentPillY.current;
            // Lerp factor — lower = smoother but laggier, higher = more responsive
            const factor = 0.18;

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
    const applyVisuals = useCallback((floatIdx: number) => {
        if (!pillRef.current || N === 0) return;

        // Set target for lerp-based pill position
        const newPillY = getPillY(floatIdx);
        targetPillY.current = newPillY;
        startLerp();

        const rounded = Math.round(floatIdx);
        const activeYear = flat[rounded]?.year ?? 0;
        const activeYearGroupIdx = groups.findIndex(g => g.year === activeYear);

        // Update month labels + dots
        if (rounded !== prevActive.current) {
            prevActive.current = rounded;
            for (let i = 0; i < N; i++) {
                const btn = monthRefs.current[i];
                const dot = dotRefs.current[i];
                if (!btn || !dot) continue;
                const isActive = i === rounded;
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
    }, [N, flat, groups, getPillY, startLerp]);

    /* ── scroll listener (rAF-throttled) ── */
    useEffect(() => {
        measureCards();
        const onResize = () => measureCards();
        window.addEventListener("resize", onResize);

        // Listen for lazy-loaded activities finishing their mount to remeasure
        window.addEventListener("timeline-measure", onResize);

        const onScroll = () => {
            if (isDragging.current) return;
            cancelAnimationFrame(rafId.current);
            rafId.current = requestAnimationFrame(() => applyVisuals(getFloat(window.scrollY)));
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
        const t = setTimeout(() => {
            measureCards();
            const f = getFloat(window.scrollY);
            applyVisuals(f);
        }, 600);

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("timeline-measure", onResize);
            clearTimeout(t);
            cancelAnimationFrame(rafId.current);
            cancelAnimationFrame(lerpRafId.current);
        };
    }, [measureCards, getFloat, applyVisuals, getPillY]);

    /* ── pointer / drag ── */
    const getIdxFromY = useCallback((clientY: number): number => {
        const btns = monthRefs.current;
        if (!rootRef.current || !btns[0] || !btns[N - 1]) return 0;

        const rootRect = rootRef.current.getBoundingClientRect();
        const firstRect = btns[0]!.getBoundingClientRect();
        const lastRect = btns[N - 1]!.getBoundingClientRect();

        const topPx = (firstRect.top - rootRect.top) + firstRect.height / 2;
        const botPx = (lastRect.top - rootRect.top) + lastRect.height / 2;

        const localY = clientY - rootRect.top;
        if (botPx === topPx) return 0;
        const t = Math.max(0, Math.min(1, (localY - topPx) / (botPx - topPx)));
        return t * (N - 1);
    }, [N]);

    const scrollToFloat = useCallback((fIdx: number) => {
        const t = cardTops.current;
        if (N <= 1) { window.scrollTo({ top: t[0] ?? 0, behavior: "auto" }); return; }
        const i = Math.floor(Math.min(fIdx, N - 2));
        const frac = fIdx - i;
        window.scrollTo({ top: t[i] + frac * ((t[i + 1] ?? t[i]) - t[i]), behavior: "auto" });
    }, [N]);

    const dragStartY = useRef(0);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        isDragging.current = true;
        suppressClick.current = false;
        dragStartY.current = e.clientY;
        measureCards();
        const idx = getIdxFromY(e.clientY);
        scrollToFloat(idx);
        applyVisuals(idx);
    }, [measureCards, getIdxFromY, scrollToFloat, applyVisuals]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        e.preventDefault();
        // Mark as a real drag if moved more than 4px
        if (Math.abs(e.clientY - dragStartY.current) > 4) {
            suppressClick.current = true;
        }
        const idx = getIdxFromY(e.clientY);
        scrollToFloat(idx);
        applyVisuals(idx);
    }, [getIdxFromY, scrollToFloat, applyVisuals]);

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        isDragging.current = false;
        // Don't recalculate from scroll — keep the position where we dragged to
    }, []);

    const handleClick = useCallback((id: string) => {
        // Suppress click if it followed a drag (pointer capture fires click on original element)
        if (suppressClick.current) {
            suppressClick.current = false;
            return;
        }
        const el = document.getElementById(id);
        if (el) {
            window.scrollTo({
                top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.25,
                behavior: "smooth",
            });
        }
    }, []);

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
          opacity: 0.75;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                      filter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          filter: blur(0.1px);
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
                className="tl-root fixed right-4 top-24 z-50 hidden lg:flex flex-col items-end select-none touch-none cursor-grab active:cursor-grabbing"
                style={{
                    width: 160,
                    height: "calc(100vh - 200px)",
                    minHeight: 400,
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
                    className="absolute pointer-events-none"
                    style={{
                        right: 4,
                        width: 120,
                        height: 32,
                        background: "var(--tl-pill-bg)",
                        backdropFilter: "blur(var(--tl-backdrop-blur)) saturate(1.8)",
                        WebkitBackdropFilter: "blur(var(--tl-backdrop-blur)) saturate(1.8)",
                        border: "1px solid var(--tl-pill-border)",
                        borderRadius: 12,
                        boxShadow: "var(--tl-pill-shadow)",
                        willChange: "transform",
                        /* No CSS transition — driven purely by rAF lerp */
                    }}
                />

                {/* ── Year-grouped items (grid style) ── */}
                <div className="relative flex flex-col justify-between h-full w-full py-5">
                    {groups.map((g, gi) => (
                        <div
                            key={g.year}
                            ref={(el) => { yearRefs.current[gi] = el; }}
                            className="tl-year-group tl-ease flex flex-col min-h-0"
                            style={{ flexGrow: g.months.length || 1 }}
                            data-focus="true"
                        >
                            {/* Year header */}
                            <div className="flex items-center justify-end pr-3" style={{ gap: 8 }}>
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
                                <div style={{ width: "20px", height: 1, background: "var(--tl-separator)" }} />
                            </div>

                            {/* Month entries */}
                            <div className="flex flex-col flex-1 justify-evenly overflow-hidden min-h-0">
                                {g.months.map((m) => (
                                    <button
                                        key={m.id}
                                        ref={(el) => { monthRefs.current[m.flatIdx] = el; }}
                                        onClick={(e) => { e.stopPropagation(); handleClick(m.id); }}
                                        className="tl-month tl-ease relative flex items-center justify-end pr-3 cursor-pointer"
                                        data-state="idle"
                                        style={{
                                            fontSize: "max(10px, min(1.2vh, 13px))",
                                            lineHeight: 1,
                                            padding: "max(2px, min(0.6vh, 8px)) 14px max(2px, min(0.6vh, 8px)) 0",
                                            gap: 8,
                                            background: "none",
                                            border: "none",
                                            minHeight: 0,
                                        }}
                                    >
                                        {/* Month label */}
                                        <span className="whitespace-nowrap" style={{ fontFamily: "inherit" }}>
                                            {m.month}
                                        </span>

                                        {/* Dot */}
                                        <div
                                            ref={(el) => { dotRefs.current[m.flatIdx] = el; }}
                                            className="tl-dot tl-ease rounded-full shrink-0"
                                            data-state="idle"
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Separator between year groups */}
                            {gi < groups.length - 1 && <div className="shrink-0" style={{ height: "1vh" }} />}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
