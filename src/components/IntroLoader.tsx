"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

const GREETING_STEP_MS = 58;
const FINAL_GREETING_DELAY_MS = (greetings.length - 1) * GREETING_STEP_MS;
const FINAL_GREETING_HOLD_MS = 900;
const MINIMUM_LOADER_MS = FINAL_GREETING_DELAY_MS + FINAL_GREETING_HOLD_MS;

export default function IntroLoader() {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
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
    }, MINIMUM_LOADER_MS);
    const safetyTimer = window.setTimeout(
      () => setLeaving(true),
      MINIMUM_LOADER_MS + 650,
    );

    return () => {
      window.removeEventListener("hero-map-ready", handleMapReady);
      window.removeEventListener("hero-deck-ready", handleDeckReady);
      window.clearTimeout(minimumTimer);
      window.clearTimeout(safetyTimer);
    };
  }, []);

  return (
    <>
      <style>{`
        .intro-loader { animation: introSafety ${MINIMUM_LOADER_MS + 500}ms cubic-bezier(.22,.8,.24,1) forwards; }
        .intro-loader[data-leaving="true"] { animation: introOverlayExit 220ms cubic-bezier(.22,.8,.24,1) forwards; }
        /* Printed on the same stock as the rest of the site, rather than
           projected on a light box. A soft photograph on paper reads as a
           photograph on paper; the same frame at full screen brightness just
           reads as out of focus. */
        .intro-loader__image {
          filter: brightness(0.82) contrast(1.06) saturate(0.92);
        }
        /* Warm ink over the whole frame, in the page's own foreground hue so
           it darkens without going grey. */
        .intro-loader__ink {
          background: hsl(28 26% 12% / 0.38);
        }
        /* The page's grain tile, at the page's tile size, multiplied into the
           photograph so the picture picks up the paper it sits on. */
        .intro-loader__grain {
          background-image: url("/img/paper-grain.png");
          background-size: 128px 128px;
          opacity: 0.55;
          mix-blend-mode: multiply;
        }
        /* The only shade on the page: a pool directly under the greeting, so
           white type stays readable over a sunlit subject without dimming the
           rest of the frame. */
        .intro-loader__floor {
          background: radial-gradient(40% 42% at 50% 50%, rgba(3,6,8,.82), rgba(3,6,8,.4) 56%, transparent 78%);
          filter: blur(12px);
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
          /* Shade that hugs the glyphs. With nothing dimming the photo any
             more, the type has to carry its own contrast over a sunlit shirt. */
          text-shadow:
            0 1px 2px rgba(0,0,0,.7),
            0 2px 12px rgba(0,0,0,.6),
            0 0 40px rgba(0,0,0,.5);
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
        .intro-loader__word { animation: introWord 82ms cubic-bezier(.22,.8,.24,1) both; }
        .intro-loader__final {
          min-height: 2.65em;
          padding-block: .5em .72em;
          animation: introFinal 220ms cubic-bezier(.22,.8,.24,1) both;
        }
        .intro-loader__progress {
          animation: introProgress ${MINIMUM_LOADER_MS}ms linear forwards;
        }
        @keyframes introWord {
          0% { opacity: 0; transform: translateY(9px); }
          18%, 70% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-7px); }
        }
        @keyframes introFinal {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes introOverlayExit {
          from { visibility: visible; opacity: 1; }
          100% { visibility: hidden; pointer-events: none; opacity: 0; }
        }
        @keyframes introSafety {
          0%, 94% { visibility: visible; opacity: 1; }
          100% { visibility: hidden; pointer-events: none; opacity: 0; }
        }
        @keyframes introProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .intro-loader__word { display: none; }
          .intro-loader__final { animation: none; opacity: 1; }
        }
      `}</style>
      <div
        data-intro-loader
        data-leaving={leaving}
        className="intro-loader fixed inset-0 z-[10000] grid place-items-center overflow-hidden bg-[hsl(28_14%_10%)] text-white"
        role="status"
        aria-label="Loading Akash's portfolio"
      >
        <Image
          src="/img/akash-4.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={92}
          className="intro-loader__image object-cover object-[54%_72%]"
        />
        <span className="intro-loader__ink pointer-events-none absolute inset-0" />
        <span className="intro-loader__grain pointer-events-none absolute inset-0" />

        <div
          className="relative flex h-64 w-full items-center justify-center overflow-visible px-5 sm:h-72"
          aria-hidden="true"
        >
          <span className="intro-loader__floor pointer-events-none absolute inset-x-10 inset-y-8" />
          {greetings.map((greeting, index) => (
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

        <span className="absolute right-5 bottom-6 left-5 h-px overflow-hidden bg-white/25 sm:right-8 sm:left-8">
          <span className="intro-loader__progress block h-full origin-left bg-white" />
        </span>
      </div>
    </>
  );
}
