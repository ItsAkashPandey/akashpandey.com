"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

/**
 * Written in each language's own script rather than romanised — a romanised
 * "Namaste" reads as English with an accent; नमस्ते reads as Hindi. Only the
 * languages that share the Latin alphabet stay as-is.
 */
const greetings: { text: string; rtl?: boolean }[] = [
  { text: "Hello" },
  { text: "Hola" },
  { text: "Bonjour" },
  { text: "Ciao" },
  { text: "Hallo" },
  { text: "Olá" },
  { text: "Hej" },
  { text: "Jambo" },
  { text: "Merhaba" },
  { text: "Halo" },
  { text: "مرحبا", rtl: true },
  { text: "שלום", rtl: true },
  { text: "你好" },
  { text: "こんにちは" },
  { text: "안녕" },
  { text: "নমস্কার" },
  { text: "வணக்கம்" },
  { text: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ" },
  { text: "नमस्ते" },
];

// Two different words fading through each other at the same spot overprint at
// the halfway mark no matter how the easing is tuned — both are legible at 50%
// and the frame reads as one garbled word. The greetings roll through a clipped
// slot instead, so only one is ever in view and they cannot share pixels.
/** Line box for one greeting, shared by the slot, the lines and the roll. */
const LINE_EM = 1.45;
const GREETING_STEP_MS = 125;
const ROLL_MS = (greetings.length - 1) * GREETING_STEP_MS;
const FINAL_GREETING_HOLD_MS = 900;
const SEQUENCE_MS = ROLL_MS + FINAL_GREETING_HOLD_MS;

/** Hold each greeting still, then flick to the next in the last third of its step. */
const rollKeyframes = greetings
  .map((_, index) => {
    const span = 100 / (greetings.length - 1);
    const start = index * span;
    const hold = index === greetings.length - 1 ? 100 : start + span * 0.66;
    // In `em`, not `%`: a percentage on the track resolves against the whole
    // stack of greetings, so one step would scroll past all of them at once.
    return `${start.toFixed(3)}%,${hold.toFixed(3)}% { transform: translate3d(0, -${(index * LINE_EM).toFixed(2)}em, 0); }`;
  })
  .join("\n          ");
/** How long to wait on a slow connection before starting without the photo. */
const PHOTO_GRACE_MS = 900;

export default function IntroLoader() {
  const [leaving, setLeaving] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const [started, setStarted] = useState(false);

  const begin = useCallback(() => setStarted(true), []);

  // The greeting cycle used to run from first paint, so on anything but a warm
  // cache the photo only arrived somewhere around "नमस्ते" — most of the
  // sequence played out over an empty frame. It now waits for the image to
  // decode, with a grace period so a slow connection cannot stall the page.
  useEffect(() => {
    const timer = window.setTimeout(begin, PHOTO_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [begin]);

  useEffect(() => {
    if (photoReady) begin();
  }, [photoReady, begin]);

  useEffect(() => {
    if (!started) return;

    let minimumElapsed = false;
    const isHome = window.location.pathname === "/";
    let mapReady =
      !isHome || document.documentElement.dataset.heroMapReady === "true";
    let deckReady =
      !isHome || document.documentElement.dataset.heroDeckReady === "true";

    const leaveWhenReady = () => {
      if (minimumElapsed && mapReady && deckReady) setLeaving(true);
    };
    const handleMapReady = () => {
      mapReady = true;
      leaveWhenReady();
    };
    const handleDeckReady = () => {
      deckReady = true;
      leaveWhenReady();
    };

    window.addEventListener("hero-map-ready", handleMapReady);
    window.addEventListener("hero-deck-ready", handleDeckReady);
    const minimumTimer = window.setTimeout(() => {
      minimumElapsed = true;
      leaveWhenReady();
    }, SEQUENCE_MS);
    const safetyTimer = window.setTimeout(
      () => setLeaving(true),
      SEQUENCE_MS + 700,
    );

    return () => {
      window.removeEventListener("hero-map-ready", handleMapReady);
      window.removeEventListener("hero-deck-ready", handleDeckReady);
      window.clearTimeout(minimumTimer);
      window.clearTimeout(safetyTimer);
    };
  }, [started]);

  return (
    <>
      <style>{`
        .intro-loader[data-leaving="true"] { animation: introOverlayExit 420ms cubic-bezier(.4,0,.2,1) forwards; }
        /* Printed on the same stock as the rest of the site, rather than
           projected on a light box. */
        .intro-loader__image {
          opacity: 0;
          transform: scale(1.05);
          transition:
            opacity 420ms cubic-bezier(.4,0,.2,1),
            transform 4200ms cubic-bezier(.16,.7,.24,1);
          filter: brightness(0.86) contrast(1.05) saturate(0.94);
        }
        .intro-loader[data-photo="true"] .intro-loader__image {
          opacity: 1;
          transform: scale(1);
        }
        /* An even top-to-bottom grade, the way a title card is lit. The pool of
           shade that used to sit behind the greeting read as a black smudge
           dropped on the picture; this darkens without drawing a shape. */
        .intro-loader__ink {
          background: linear-gradient(
            180deg,
            rgba(18,14,11,.26) 0%,
            rgba(18,14,11,.24) 38%,
            rgba(18,14,11,.32) 72%,
            rgba(18,14,11,.52) 100%
          );
        }
        .intro-loader__grain {
          background-image: url("/img/paper-grain.png");
          background-size: 128px 128px;
          opacity: 0.5;
          mix-blend-mode: multiply;
        }
        .intro-loader__slot {
          overflow: hidden;
          height: ${LINE_EM}em;
          width: 100%;
          mask-image: linear-gradient(180deg, transparent, black 18%, black 82%, transparent);
        }
        .intro-loader__track {
          animation: introRoll ${ROLL_MS}ms cubic-bezier(.62,0,.2,1) forwards;
          will-change: transform;
        }
        .intro-loader__line {
          display: flex;
          align-items: center;
          justify-content: center;
          height: ${LINE_EM}em;
          white-space: nowrap;
          line-height: 1;
          /* The site's own display serif leads, so the first thing a visitor
             sees is the face the page titles are set in. The browser walks the
             list per character, so the scripts Calistoga does not cover fall
             through to their own Noto cut and the CJK ones to the platform. */
          font-family:
            var(--font-serif), var(--font-devanagari), var(--font-bengali),
            var(--font-tamil), var(--font-gurmukhi), var(--font-arabic),
            var(--font-hebrew), "Noto Sans SC", "PingFang SC", "Microsoft YaHei",
            "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Noto Sans KR",
            "Malgun Gothic", "Nirmala UI", serif;
          letter-spacing: -0.015em;
        }
        .intro-loader__rule {
          animation: introRule ${SEQUENCE_MS}ms cubic-bezier(.35,0,.15,1) forwards;
        }
        @keyframes introRoll {
          ${rollKeyframes}
        }
        @keyframes introOverlayExit {
          from { visibility: visible; opacity: 1; transform: scale(1); }
          99%  { visibility: visible; }
          100% { visibility: hidden; pointer-events: none; opacity: 0; transform: scale(1.04); }
        }
        @keyframes introRule {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .intro-loader__image { transition: opacity 200ms linear; transform: none; }
          .intro-loader__track { animation: none; transform: translate3d(0, -${((greetings.length - 1) * LINE_EM).toFixed(2)}em, 0); }
          .intro-loader__rule { animation: none; transform: scaleX(1); }
        }
      `}</style>
      <div
        data-intro-loader
        data-leaving={leaving}
        data-photo={photoReady}
        className="intro-loader fixed inset-0 z-[10000] grid place-items-center overflow-hidden bg-[hsl(30_16%_9%)] text-white"
        role="status"
        aria-label="Loading Akash's portfolio"
      >
        <Image
          src="/img/akash-4.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={90}
          onLoad={() => setPhotoReady(true)}
          className="intro-loader__image object-cover object-[54%_72%]"
        />
        <span className="intro-loader__ink pointer-events-none absolute inset-0" />
        <span className="intro-loader__grain pointer-events-none absolute inset-0" />

        <div
          className="relative flex h-64 w-full items-center justify-center px-5 sm:h-72"
          aria-hidden="true"
        >
          {started && (
            <div className="intro-loader__slot text-3xl font-normal sm:text-5xl lg:text-6xl">
              <div className="intro-loader__track">
                {greetings.map((greeting) => (
                  <div
                    key={greeting.text}
                    dir={greeting.rtl ? "rtl" : undefined}
                    className="intro-loader__line"
                  >
                    {greeting.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <span className="absolute right-6 bottom-7 left-6 h-px overflow-hidden bg-white/20 sm:right-10 sm:left-10">
          {started && (
            <span className="intro-loader__rule block h-full origin-left bg-white/85" />
          )}
        </span>
      </div>
    </>
  );
}
