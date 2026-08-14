"use client";

import {
  findLanding,
  findNearbySurface,
  readPerch,
  type Perch,
} from "@/lib/puppy/perch";
import { useCallback, useEffect, useRef, useState } from "react";
import PuppyCanvas, { type PuppyDrive, type PuppyMood } from "./PuppyCanvas";

const SIZE = 130;
const SIZE_SMALL = 100;
const GRAVITY = 2400;
const HOME_RATIO = 0.26;
/** Pixels the pointer must move before a click becomes a drag. */
const DRAG_THRESHOLD = 6;
/** px/s walk speed on a perch surface */
const WALK_SPEED = 38;

type Mode =
  | "resting"
  | "pending"   // pointerDown but haven't exceeded drag threshold
  | "dragging"
  | "falling"
  | "walking"   // autonomous walking on a surface
  | "jumping";  // autonomous jump to another element

export default function Puppy() {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [barkText, setBarkText] = useState("woof");
  const [barking, setBarking] = useState(false);

  const shell = useRef<HTMLDivElement>(null);
  const barkTimer = useRef<number>(0);

  const mode = useRef<Mode>("resting");
  const pos = useRef({ x: 0, y: 0 });
  const velocity = useRef(0);
  const landingY = useRef(0);
  const perch = useRef<Perch | null>(null);
  const moved = useRef(false);
  const grab = useRef({ x: 0, y: 0 });
  const grabStart = useRef({ x: 0, y: 0 });
  const hovered = useRef(false);
  const calm = useRef(false);
  const walkDir = useRef(1);
  const walkTarget = useRef(0);
  const ambientMood = useRef<PuppyMood>("idle");
  const idleTimer = useRef(0);
  const lastScrollY = useRef(0);
  const scrollReactTimer = useRef(0);
  const cursorPos = useRef({ x: 0, y: 0 });
  const lickTimer = useRef(0);
  const jumpVelX = useRef(0);
  const jumpVelY = useRef(0);
  const jumpTarget = useRef<Perch | null>(null);

  const drive = useRef<PuppyDrive>({
    pointer: { x: 0, y: 0 },
    selfX: 0,
    selfY: 0,
    mood: "idle",
    pokedAt: 0,
    actionAt: 0,
    actionType: "jump",
    calm: false,
  });

  const showBark = useCallback((text: string) => {
    setBarkText(text);
    setBarking(true);
    window.clearTimeout(barkTimer.current);
    barkTimer.current = window.setTimeout(() => setBarking(false), 1400);
  }, []);

  const triggerAction = useCallback(
    (action: PuppyDrive["actionType"], text: string) => {
      drive.current.actionAt = performance.now();
      drive.current.actionType = action;
      showBark(text);
    },
    [showBark],
  );

  // Initial position
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      calm.current = reduced.matches;
      drive.current.calm = reduced.matches;
    };
    sync();
    reduced.addEventListener("change", sync);

    const seed = {
      x: Math.max(window.innerWidth, 360) - 120,
      y: Math.max(window.innerHeight, 360),
    };
    pos.current = seed;
    lastScrollY.current = window.scrollY;
    idleTimer.current = performance.now();
    setStart(seed);

    return () => reduced.removeEventListener("change", sync);
  }, []);

  // React to scroll
  useEffect(() => {
    const onScroll = () => {
      const dy = window.scrollY - lastScrollY.current;
      lastScrollY.current = window.scrollY;

      if (mode.current === "resting" && Math.abs(dy) > 12) {
        const now = performance.now();
        if (now - scrollReactTimer.current > 3000) {
          scrollReactTimer.current = now;
          ambientMood.current = "alert";
          // Re-check perch after scroll since elements moved
          if (perch.current) {
            const spot = readPerch(perch.current);
            if (!spot) {
              perch.current = null;
              const node = shell.current;
              if (node) {
                const landing = findLanding(pos.current.x, pos.current.y, node);
                landingY.current = landing.y;
                perch.current = landing.perch;
                velocity.current = 0;
                mode.current = "falling";
              }
            }
          }
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const drop = useCallback(() => {
    const node = shell.current;
    if (!node) return;
    const landing = findLanding(pos.current.x, pos.current.y, node);
    landingY.current = landing.y;
    perch.current = landing.perch;

    if (calm.current) {
      pos.current.y = landing.y;
      mode.current = "resting";
      return;
    }

    velocity.current = 0;
    mode.current = "falling";
  }, []);

  // Pointer event handlers
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      cursorPos.current = { x: event.clientX, y: event.clientY };
      drive.current.pointer = { x: event.clientX, y: event.clientY };

      if (mode.current === "pending") {
        const dx = event.clientX - grabStart.current.x;
        const dy = event.clientY - grabStart.current.y;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
          mode.current = "dragging";
          moved.current = true;
          perch.current = null;
        }
      }

      if (mode.current === "dragging") {
        pos.current = {
          x: event.clientX - grab.current.x,
          y: event.clientY - grab.current.y,
        };
      }
    };

    const onPointerUp = () => {
      if (mode.current === "pending") {
        // Was a click, not a drag
        mode.current = "resting";
        return;
      }
      if (mode.current === "dragging") {
        drop();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [drop]);

  // Ambient behavior timer — fires every 3s
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (mode.current !== "resting" || hovered.current || calm.current) return;

      const now = performance.now();
      const idleFor = now - idleTimer.current;
      const roll = Math.random();

      // Walk on viewport floor or along perch surface
      if (roll < 0.35) {
        if (perch.current) {
          const rect = perch.current.element.getBoundingClientRect();
          walkDir.current = Math.random() > 0.5 ? 1 : -1;
          walkTarget.current = walkDir.current > 0
            ? rect.left + rect.width * 0.88
            : rect.left + rect.width * 0.12;
          mode.current = "walking";
          ambientMood.current = "walk";
        } else {
          // Walking freely on viewport floor
          walkDir.current = Math.random() > 0.5 ? 1 : -1;
          const dist = 80 + Math.random() * 200;
          walkTarget.current = pos.current.x + walkDir.current * dist;
          mode.current = "walking";
          ambientMood.current = "walk";
        }
      // Jump to a nearby element
      } else if (roll < 0.55) {
        const node = shell.current;
        if (node) {
          const nearby = findNearbySurface(pos.current.x, pos.current.y, node);
          if (nearby?.perch) {
            jumpTarget.current = nearby.perch;
            const targetRect = nearby.perch.element.getBoundingClientRect();
            const tx = targetRect.left + targetRect.width * nearby.perch.ratio;
            const ty = nearby.y;
            const dx = tx - pos.current.x;
            const dy = ty - pos.current.y;
            // Parabolic arc: add upward impulse on top of the linear path
            const t = 0.55;
            jumpVelX.current = dx / t;
            // Goes up then comes down to target; peak at midpoint
            jumpVelY.current = dy / t - (GRAVITY * t) / 2 - 250;
            triggerAction("gallopJump", "wheee!");
            mode.current = "jumping";
          }
        }
      // Sleep / play dead if idle a long time
      } else if (idleFor > 20000 && roll < 0.65) {
        triggerAction("death", "zzz...");
        ambientMood.current = "idle";
        idleTimer.current = now; // reset so it doesn't loop-sleep
      // Sniff/alert idle animations
      } else if (roll < 0.75) {
        ambientMood.current = "sniff";
      } else if (roll < 0.88) {
        ambientMood.current = "alert";
      } else {
        ambientMood.current = "idle";
      }
    }, 3000);
    return () => window.clearInterval(interval);
  }, [triggerAction]);

  // Cursor lick detection
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (mode.current !== "resting" || calm.current) return;
      const dx = cursorPos.current.x - pos.current.x;
      const dy = cursorPos.current.y - pos.current.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 60) {
        const now = performance.now();
        if (now - lickTimer.current > 8000) {
          lickTimer.current = now;
          triggerAction("eating", "*lick*");
        }
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [triggerAction]);

  // Main animation/physics loop
  useEffect(() => {
    if (!start) return;
    let frame = 0;
    let last = performance.now();
    let homeCheck = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const step = Math.min((now - last) / 1000, 1 / 20);
      last = now;

      const node = shell.current;
      if (!node) return;

      if (mode.current === "falling") {
        velocity.current += GRAVITY * step;
        pos.current.y += velocity.current * step;
        if (pos.current.y >= landingY.current) {
          pos.current.y = landingY.current;
          velocity.current = 0;
          mode.current = "resting";
          idleTimer.current = now;
          // Sniff on landing
          ambientMood.current = "sniff";
          window.setTimeout(() => {
            if (mode.current === "resting") ambientMood.current = "idle";
          }, 1500);
        }
      } else if (mode.current === "jumping") {
        // Only jumpVelY carries the velocity — no double-gravity with velocity.current
        jumpVelY.current += GRAVITY * step;
        pos.current.x += jumpVelX.current * step;
        pos.current.y += jumpVelY.current * step;

        // Snap to target when we cross its surface
        if (jumpTarget.current) {
          const targetRect = jumpTarget.current.element.getBoundingClientRect();
          const ty = targetRect.top;
          if (pos.current.y >= ty) {
            pos.current.y = ty;
            perch.current = jumpTarget.current;
            jumpTarget.current = null;
            mode.current = "resting";
            idleTimer.current = now;
            ambientMood.current = "sniff";
            window.setTimeout(() => {
              if (mode.current === "resting") ambientMood.current = "idle";
            }, 1500);
          }
        }
        // Fallback: landed on viewport floor
        if (pos.current.y >= window.innerHeight) {
          pos.current.y = window.innerHeight;
          jumpTarget.current = null;
          perch.current = null;
          mode.current = "resting";
          idleTimer.current = now;
          ambientMood.current = "sniff";
          window.setTimeout(() => {
            if (mode.current === "resting") ambientMood.current = "idle";
          }, 1200);
        }
      } else if (mode.current === "walking") {
        pos.current.x += walkDir.current * WALK_SPEED * step;

        if (perch.current) {
          const rect = perch.current.element.getBoundingClientRect();
          pos.current.y = rect.top;

          // Update ratio as we walk
          perch.current.ratio = Math.max(0.05, Math.min(0.95,
            (pos.current.x - rect.left) / rect.width
          ));

          // Reached edge or target — stop
          const atEdge = pos.current.x <= rect.left + 10 || pos.current.x >= rect.right - 10;
          const atTarget = walkDir.current > 0
            ? pos.current.x >= walkTarget.current
            : pos.current.x <= walkTarget.current;

          if (atEdge || atTarget) {
            mode.current = "resting";
            ambientMood.current = "idle";
            idleTimer.current = now;
          }
        } else {
          // Walking on viewport floor
          pos.current.y = window.innerHeight;
          const atTarget = walkDir.current > 0
            ? pos.current.x >= walkTarget.current
            : pos.current.x <= walkTarget.current;
          if (atTarget) {
            mode.current = "resting";
            ambientMood.current = "idle";
            idleTimer.current = now;
          }
        }
      } else if (mode.current === "resting") {
        // Try to perch on Kasi window if not yet moved
        if (!moved.current && now - homeCheck > 400) {
          homeCheck = now;
          const kasi = document.querySelector<HTMLElement>("[data-kasi-window]");
          if (kasi && perch.current?.element !== kasi) {
            perch.current = { element: kasi, ratio: HOME_RATIO };
          }
        }

        if (perch.current) {
          const spot = readPerch(perch.current);
          if (spot) {
            pos.current = spot;
          } else {
            perch.current = null;
            if (!calm.current) {
              // Surface gone — find new landing
              const landing = findLanding(pos.current.x, pos.current.y, node);
              landingY.current = landing.y;
              perch.current = landing.perch;
              velocity.current = 0;
              mode.current = "falling";
            }
          }
        }
      }

      // Clamp X
      const size = window.innerWidth < 640 ? SIZE_SMALL : SIZE;
      pos.current.x = Math.min(
        Math.max(pos.current.x, size / 2),
        window.innerWidth - size / 2,
      );

      node.style.transform = `translate3d(${Math.round(pos.current.x)}px, ${Math.round(
        pos.current.y,
      )}px, 0)`;

      drive.current.selfX = pos.current.x;
      drive.current.selfY = pos.current.y - size * 0.42;
      drive.current.mood = moodOf(mode.current, hovered.current, ambientMood.current);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start]);

  if (!start) return null;

  return (
    <div
      ref={shell}
      className="puppy"
      style={{
        transform: `translate3d(${Math.round(start.x)}px, ${Math.round(
          start.y,
        )}px, 0)`,
      }}
    >
      <div className="puppy__stage">
        <PuppyCanvas drive={drive} />
      </div>

      <span
        className="puppy__grab"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          // Don't immediately drag — wait for movement threshold
          mode.current = "pending";
          grabStart.current = { x: event.clientX, y: event.clientY };
          grab.current = {
            x: event.clientX - pos.current.x,
            y: event.clientY - pos.current.y,
          };
        }}
        onPointerEnter={() => {
          hovered.current = true;
          ambientMood.current = "alert";
        }}
        onPointerLeave={() => {
          hovered.current = false;
          if (mode.current === "resting") {
            ambientMood.current = "idle";
          }
        }}
        onClick={(event) => {
          event.preventDefault();
          // Only process click if we didn't drag
          if (mode.current !== "resting" && mode.current !== "pending") return;
          mode.current = "resting";
          idleTimer.current = performance.now();

          const tricks: Array<{ action: PuppyDrive["actionType"]; text: string }> = [
            { action: "jump", text: "woof!" },
            { action: "jump", text: "arf!" },
            { action: "hitLeft", text: "hey!" },
            { action: "hitRight", text: "hehe!" },
            { action: "attack", text: "pounce!" },
            { action: "gallopJump", text: "play!" },
            { action: "eating", text: "yum!" },
          ];
          const picked = tricks[Math.floor(Math.random() * tricks.length)];
          triggerAction(picked.action, picked.text);
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          // Double click = special trick
          const special: Array<{ action: PuppyDrive["actionType"]; text: string }> = [
            { action: "death", text: "play dead!" },
            { action: "gallopJump", text: "backflip!" },
            { action: "attack", text: "zoomies!" },
          ];
          const picked = special[Math.floor(Math.random() * special.length)];
          triggerAction(picked.action, picked.text);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          const reactions: Array<{ action: PuppyDrive["actionType"]; text: string }> = [
            { action: "death", text: "roll over!" },
            { action: "eating", text: "treat?" },
            { action: "hitLeft", text: "shake!" },
            { action: "hitRight", text: "high five!" },
          ];
          const picked = reactions[Math.floor(Math.random() * reactions.length)];
          triggerAction(picked.action, picked.text);
        }}
      />
      <span className="puppy__bark" data-on={barking || undefined} aria-hidden>
        {barkText}
      </span>
      <span className="sr-only">
        An interactive shiba puppy. Click to play, drag to carry, right-click
        for tricks. It walks, jumps between elements, and reacts to scrolling.
      </span>
    </div>
  );
}

function moodOf(
  mode: Mode,
  hovered: boolean,
  ambient: PuppyMood,
): PuppyMood {
  if (mode === "dragging" || mode === "pending") return "carried";
  if (mode === "falling") return "landing";
  if (mode === "walking") return "walk";
  if (mode === "jumping") return "gallopJump";
  return hovered ? "alert" : ambient;
}
