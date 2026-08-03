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

// Slower than a flicker and long enough to overlap, so one greeting dissolves
// into the next instead of blinking out before the next blinks in.
const GREETING_STEP_MS = 88;
const GREETING_SPAN_MS = 240;
const FINAL_GREETING_DELAY_MS = (greetings.length - 1) * GREETING_STEP_MS;
const FINAL_GREETING_HOLD_MS = 940;
const SEQUENCE_MS = FINAL_GREETING_DELAY_MS + FINAL_GREETING_HOLD_MS;
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
            opacity 900ms cubic-bezier(.22,.8,.24,1),
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
            rgba(18,14,11,.20) 0%,
            rgba(18,14,11,.12) 34%,
            rgba(18,14,11,.26) 70%,
            rgba(18,14,11,.50) 100%
          );
        }
        .intro-loader__grain {
          background-image: url("/img/paper-grain.png");
          background-size: 128px 128px;
          opacity: 0.5;
          mix-blend-mode: multiply;
        }
        .intro-loader__word, .intro-loader__final {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 2.45em;
          opacity: 0;
          white-space: nowrap;
          line-height: 1.18;
          padding: .34em .26em .48em;
          overflow: visible;
          text-shadow:
            0 1px 3px rgba(0,0,0,.55),
            0 3px 18px rgba(0,0,0,.45);
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
          will-change: opacity, transform, filter;
        }
        .intro-loader__word {
          animation: introWord ${GREETING_SPAN_MS}ms cubic-bezier(.33,0,.2,1) both;
        }
        .intro-loader__final {
          min-height: 2.65em;
          padding-block: .5em .72em;
          animation: introFinal 620ms cubic-bezier(.16,.8,.24,1) both;
        }
        .intro-loader__rule {
          animation: introRule ${SEQUENCE_MS}ms cubic-bezier(.35,0,.15,1) forwards;
        }
        /* Each greeting rises through focus and leaves through it again. The
           blur is what turns a hard cut into a dissolve at this speed. */
        @keyframes introWord {
          0%   { opacity: 0; transform: translateY(14px) scale(.97); filter: blur(7px); }
          32%  { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          62%  { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          100% { opacity: 0; transform: translateY(-11px) scale(1.02); filter: blur(6px); }
        }
        @keyframes introFinal {
          0%   { opacity: 0; transform: translateY(18px) scale(.95); filter: blur(9px); letter-spacing: .04em; }
          60%  { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); letter-spacing: -.015em; }
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
          .intro-loader__word { display: none; }
          .intro-loader__final { animation: none; opacity: 1; }
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
          className="relative flex h-64 w-full items-center justify-center overflow-visible px-5 sm:h-72"
          aria-hidden="true"
        >
          {started &&
            greetings.map((greeting, index) => (
              <span
                key={greeting.text}
                dir={greeting.rtl ? "rtl" : undefined}
                className={`text-3xl font-normal sm:text-5xl lg:text-6xl ${
                  index === greetings.length - 1
                    ? "intro-loader__final"
                    : "intro-loader__word"
                }`}
                style={{ animationDelay: `${index * GREETING_STEP_MS}ms` }}
              >
                {greeting.text}
              </span>
            ))}
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
