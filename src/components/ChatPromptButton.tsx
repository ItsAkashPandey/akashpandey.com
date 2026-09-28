"use client";

import { useChatbot } from "@/contexts/ChatContext";
import { ArrowDown, ArrowDownRight } from "lucide-react";

interface Props {
  chatPrompt: string;
}

export default function ChatPromptButton({ chatPrompt }: Props) {
  const { setIsOpen } = useChatbot();

  return (
    <button
      type="button"
      data-kasi-toggle
      onClick={() => setIsOpen(true)}
      className="group focus-visible:ring-ring mx-auto mt-6 flex w-fit items-center gap-1 rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none sm:mx-0"
    >
      <span className="text-sm font-semibold text-balance underline-offset-4 group-hover:underline sm:text-base">
        {chatPrompt}
      </span>
      <ArrowDownRight
        aria-hidden
        className="group-hover:animate-smooth-bounce hidden size-5 sm:block"
      />
      <ArrowDown
        aria-hidden
        className="group-hover:animate-smooth-bounce block size-5 sm:hidden"
      />
    </button>
  );
}
