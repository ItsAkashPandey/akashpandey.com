import { useChatbot } from "@/contexts/ChatContext";
import { Suspense, lazy, useCallback, useState, useEffect } from "react";
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
      <div className="flex flex-1 flex-col justify-end gap-3 overflow-hidden p-2 sm:gap-4 sm:p-3">
        <div className="flex items-start justify-end">
          <Skeleton className="h-10 w-[220px] rounded-lg sm:w-64" />
        </div>

        <div className="flex items-start justify-start">
          <Skeleton className="mr-2 mt-0.5 h-4 w-4 shrink-0 rounded-full sm:mr-2.5 sm:h-5 sm:w-5" />
          <Skeleton className="h-20 w-[220px] rounded-lg sm:w-64" />
        </div>

        <div className="flex items-start justify-end">
          <Skeleton className="h-10 w-[220px] rounded-lg sm:w-64" />
        </div>

        <div className="flex items-start justify-start">
          <Skeleton className="mr-2 mt-0.5 h-4 w-4 shrink-0 rounded-full sm:mr-2.5 sm:h-5 sm:w-5" />
          <Skeleton className="h-20 w-[220px] rounded-lg sm:w-64" />
        </div>
      </div>

      <div className="flex gap-1.5 border-t px-2 py-2 backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-2.5">
        <Skeleton className="h-9 w-10 sm:h-10 sm:w-12" />
        <Skeleton className="h-8 flex-1 sm:h-9" />
        <Skeleton className="h-9 w-10 sm:h-10 sm:w-12" />
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        Loading chat…
      </span>
    </div>
  );
}

export default function Chat() {
  const { isVisible, isOpen, setIsOpen } = useChatbot();

  const [expandedValue, setExpandedValue] = useState<string>("");
  const [hasOpened, setHasOpened] = useState(false);

  // Sync with global isOpen state (both opening and closing)
  useEffect(() => {
    if (isOpen && expandedValue !== "item-1") {
      setExpandedValue("item-1");
      setHasOpened(true);
    } else if (!isOpen && expandedValue === "item-1") {
      setExpandedValue("");
    }
  }, [isOpen, expandedValue]);

  const handleValueChange = useCallback((nextValue: string) => {
    setExpandedValue(nextValue);
    if (nextValue) {
      setHasOpened(true);
    }
    // Sync back to context
    setIsOpen(nextValue === "item-1");
  }, [setIsOpen]);

  const isExpanded = expandedValue === "item-1";

  return (
    isVisible && (
      <Accordion
        type="single"
        collapsible
        value={expandedValue}
        onValueChange={handleValueChange}
        className="relative z-[60] flex"
      >
        <AccordionItem
          value="item-1"
          style={{
            background: "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
          }}
          className={`fixed bottom-3 overflow-hidden shadow-2xl transition-all duration-300 ease-out dark:!bg-[rgba(20,20,20,0.55)] dark:!border-[rgba(255,255,255,0.15)] sm:bottom-8 sm:left-auto sm:right-8 ${isExpanded ? "left-3 right-3 w-auto rounded-[1.5rem] sm:left-auto sm:w-[360px]" : "right-3 w-14 rounded-full"}`}
        >
          <AccordionTrigger
            className={`border-b border-white/20 transition-colors hover:bg-white/10 dark:border-white/10 dark:hover:bg-white/5 ${isExpanded ? "px-5 py-3.5" : "size-14 justify-center p-0"}`}
          >
            <ChatHeader compact={!isExpanded} />
          </AccordionTrigger>
          <AccordionContent
            forceMount={hasOpened ? true : undefined}
            className="p-0"
          >
            {hasOpened && (
              <div
                className={
                  isExpanded
                    ? "flex max-h-[min(420px,calc(100vh-8rem))] min-h-[340px] flex-col justify-between rounded-b-lg sm:max-h-[480px] sm:min-h-[380px]"
                    : "hidden"
                }
              >
                <Suspense fallback={<ChatPanelFallback />}>
                  <ChatPanel isExpanded={isExpanded} />
                </Suspense>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  );
}
