"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const greetings = [
  "Hello",
  "Hola",
  "Bonjour",
  "Ciao",
  "Hallo",
  "Ola",
  "Hej",
  "Jambo",
  "Merhaba",
  "Halo",
  "Marhaba",
  "Shalom",
  "Ni hao",
  "Konnichiwa",
  "Annyeong",
  "Nomoskar",
  "Vanakkam",
  "Sat Sri Akal",
  "Namaste",
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
        .intro-loader__image { animation: introImageSettle 1.5s cubic-bezier(.22,.8,.24,1) both; }
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
          text-shadow: 0 2px 22px rgba(0,0,0,.42);
          font-family: var(--font-sans), "Nirmala UI", sans-serif;
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
          .intro-loader__word { display: none; }
          .intro-loader__final { animation: none; opacity: 1; }
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
          src="/img/akash-4.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={75}
          className="intro-loader__image object-cover object-[54%_72%]"
        />
        <span className="absolute inset-0 bg-black/42" />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,14,0.16),rgba(8,12,14,0.46))]" />

        <div
          className="relative flex h-64 w-full items-center justify-center overflow-visible px-5 sm:h-72"
          aria-hidden="true"
        >
          {greetings.map((greeting, index) => (
            <span
              key={greeting}
              className={`text-4xl font-medium sm:text-6xl lg:text-7xl ${
                index === greetings.length - 1
                  ? "intro-loader__final font-semibold"
                  : "intro-loader__word"
              }`}
              style={{ animationDelay: `${index * GREETING_STEP_MS}ms` }}
            >
              {greeting}
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
