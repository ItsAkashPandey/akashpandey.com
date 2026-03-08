"use client";

import { useChatbot } from "@/contexts/ChatContext";
import { ArrowDown, ArrowDownRight } from "lucide-react";

interface Props {
    chatPrompt: string;
}

export default function ChatPromptButton({ chatPrompt }: Props) {
    const { toggleChat } = useChatbot();

    return (
        <div
            className="mt-6 flex items-center gap-1 group cursor-pointer w-fit"
            onClick={toggleChat}
        >
            <p className="text-balance text-sm font-semibold sm:text-base">
                {chatPrompt}
            </p>
            <ArrowDownRight className="hidden size-5 sm:block group-hover:animate-smooth-bounce" />
            <ArrowDown className="block size-5 sm:hidden group-hover:animate-smooth-bounce" />
        </div>
    );
}
