"use client";

import { useChatbot } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/Accordion";
import { Skeleton } from "./ui/skeleton";

const ChatPanel = lazy(() => import("./ChatPanel"));

function ChatPanelFallback() {
  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-1 flex-col justify-end gap-3 overflow-hidden p-3 sm:gap-4">
        <div className="flex items-start justify-start">
          <Skeleton className="mt-0.5 mr-2 size-5 shrink-0 rounded-full" />
          <Skeleton className="h-20 w-[220px] rounded-lg sm:w-64" />
        </div>
      </div>
      <div className="flex gap-2 border-t px-3 py-2.5">
        <Skeleton className="size-10" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="size-10" />
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        Loading chat…
      </span>
    </div>
  );
}

/**
 * The Kasi window. The header button and the home page's prompt open it; it
 * closes from the header, its own title bar or Escape. It no longer closes on
 * any click outside it, which also swallowed the header's own close click and
 * shut the chat whenever someone selected text or used the map.
 */
export default function Chat() {
  const { isOpen, setIsOpen } = useChatbot();
  const [hasOpened, setHasOpened] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        rootRef.current?.contains(document.activeElement)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setIsOpen]);

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? "kasi" : ""}
      onValueChange={(value) => setIsOpen(value === "kasi")}
      className="relative z-[60] flex"
    >
      <AccordionItem
        ref={rootRef}
        data-kasi-window
        value="kasi"
        className={cn(
          "kasi-glass fixed right-4 bottom-4 overflow-hidden rounded-md border transition-[width,border-radius] duration-300 ease-out sm:right-8 sm:bottom-8",
          isOpen
            ? "left-4 w-auto sm:left-auto sm:w-[420px]"
            : // Closed, it is a small launcher. It only shows where the page
              // has a margin to hold it; on narrower screens the header's
              // Kasi button does the job without covering the content.
              "hidden w-[172px] min-[1600px]:block",
        )}
      >
        <AccordionTrigger
          className={cn(
            "kasi-divider transition-colors hover:no-underline [&>svg:last-child]:hidden",
            isOpen ? "border-b px-5 py-3.5" : "h-[64px] px-3 py-2",
          )}
          aria-label={isOpen ? "Close Kasi" : "Open Kasi, Akash's portfolio guide"}
        >
          <ChatHeader compact={!isOpen} />
        </AccordionTrigger>
        <AccordionContent forceMount={hasOpened ? true : undefined} className="p-0">
          {hasOpened && (
            <div
              className={
                isOpen
                  ? "flex h-[min(640px,calc(100dvh-7rem))] flex-col justify-between sm:h-[min(660px,calc(100dvh-8rem))]"
                  : "hidden"
              }
            >
              <Suspense fallback={<ChatPanelFallback />}>
                <ChatPanel isExpanded={isOpen} />
              </Suspense>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
