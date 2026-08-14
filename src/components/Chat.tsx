import { useChatbot } from "@/contexts/ChatContext";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
          <Skeleton className="mt-0.5 mr-2 h-4 w-4 shrink-0 rounded-full sm:mr-2.5 sm:h-5 sm:w-5" />
          <Skeleton className="h-20 w-[220px] rounded-lg sm:w-64" />
        </div>

        <div className="flex items-start justify-end">
          <Skeleton className="h-10 w-[220px] rounded-lg sm:w-64" />
        </div>

        <div className="flex items-start justify-start">
          <Skeleton className="mt-0.5 mr-2 h-4 w-4 shrink-0 rounded-full sm:mr-2.5 sm:h-5 sm:w-5" />
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
  const chatRootRef = useRef<HTMLDivElement>(null);

  // Sync with global isOpen state (both opening and closing)
  useEffect(() => {
    if (isOpen && expandedValue !== "item-1") {
      setExpandedValue("item-1");
      setHasOpened(true);
    } else if (!isOpen && expandedValue === "item-1") {
      setExpandedValue("");
    }
  }, [isOpen, expandedValue]);

  const handleValueChange = useCallback(
    (nextValue: string) => {
      setExpandedValue(nextValue);
      if (nextValue) {
        setHasOpened(true);
      }
      // Sync back to context
      setIsOpen(nextValue === "item-1");
    },
    [setIsOpen],
  );

  const isExpanded = expandedValue === "item-1";

  useEffect(() => {
    if (!isExpanded) return;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !chatRootRef.current?.contains(event.target)
      ) {
        setExpandedValue("");
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePress, true);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePress, true);
  }, [isExpanded, setIsOpen]);

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
          ref={chatRootRef}
          data-kasi-window
          value="item-1"
          className={`kasi-glass fixed right-4 bottom-[4.75rem] overflow-hidden border transition-[width,border-radius] duration-300 ease-out sm:right-8 sm:bottom-8 ${
            isExpanded
              ? "left-4 w-auto rounded-md sm:left-auto sm:w-[420px]"
              : "block w-[52px] rounded-md sm:w-[172px]"
          }`}
        >
          <AccordionTrigger
            className={`kasi-divider transition-colors hover:no-underline [&>svg:last-child]:hidden ${
              isExpanded
                ? "border-b px-5 py-3.5"
                : "h-[52px] px-2 py-2 sm:h-[64px] sm:px-3"
            }`}
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
                    ? "flex max-h-[min(640px,calc(100vh-8rem))] min-h-[480px] flex-col justify-between rounded-b-xl sm:max-h-[660px] sm:min-h-[560px]"
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
