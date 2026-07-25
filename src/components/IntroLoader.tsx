"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const greetings = [
  "Hello",
  "Hola",
  "Bonjour",
  "Ciao",
  "Hallo",
  "Jambo",
  "مرحبا",
  "שלום",
  "你好",
  "こんにちは",
  "안녕하세요",
  "নমস্কার",
  "வணக்கம்",
  "नमस्ते",
];

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
    }, 1_230);
    const safetyTimer = window.setTimeout(() => setLeaving(true), 2_350);

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
        .intro-loader { animation: introSafety 2.6s cubic-bezier(.22,.8,.24,1) forwards; }
        .intro-loader[data-leaving="true"] { animation: introOverlayExit 220ms cubic-bezier(.22,.8,.24,1) forwards; }
        .intro-loader__image { animation: introImageSettle 1.35s cubic-bezier(.22,.8,.24,1) both; }
        .intro-loader__word, .intro-loader__final {
          position: absolute;
          opacity: 0;
          white-space: nowrap;
        }
        .intro-loader__word { animation: introWord 94ms cubic-bezier(.22,.8,.24,1) both; }
        .intro-loader__final { animation: introFinal 170ms cubic-bezier(.22,.8,.24,1) both; }
        .intro-loader__progress {
          animation: introProgress 1.28s linear forwards;
        }
        @keyframes introWord {
          0% { opacity: 0; clip-path: inset(100% 0 0); transform: translateY(12px); }
          18%, 72% { opacity: 1; clip-path: inset(0 0 0); transform: translateY(0); }
          100% { opacity: 0; clip-path: inset(0 0 100%); transform: translateY(-10px); }
        }
        @keyframes introFinal {
          from { opacity: 0; clip-path: inset(100% 0 0); transform: translateY(12px); }
          to { opacity: 1; clip-path: inset(0 0 0); transform: translateY(0); }
        }
        @keyframes introImageSettle {
          from { transform: scale(1.025); }
          to { transform: scale(1); }
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
          .intro-loader__image { animation: none; }
        }
      `}</style>
      <div
        data-intro-loader
        data-leaving={leaving}
        className="intro-loader fixed inset-0 z-[10000] grid place-items-center overflow-hidden bg-[#151719] text-white"
        role="status"
        aria-label="Loading Akash's portfolio"
      >
        <Image
          src="/img/intro-field.webp"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="intro-loader__image object-cover"
        />
        <span className="absolute inset-0 bg-black/50" />
        <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.08),rgba(0,0,0,0.34)_50%,rgba(0,0,0,0.08))]" />

        <div className="relative flex h-24 w-full items-center justify-center border-y border-white/25">
          {greetings.map((greeting, index) => (
            <span
              key={greeting}
              className={`text-4xl font-semibold sm:text-6xl ${
                index === greetings.length - 1
                  ? "intro-loader__final"
                  : "intro-loader__word"
              }`}
              style={{ animationDelay: `${index * 74}ms` }}
            >
              {greeting}
            </span>
          ))}
        </div>

        <span className="absolute right-5 bottom-6 left-5 h-px bg-white/30 sm:right-8 sm:left-8">
          <span className="intro-loader__progress block h-full origin-left bg-white" />
        </span>
      </div>
    </>
  );
}
