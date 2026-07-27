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
            className="mx-auto mt-6 flex w-fit items-center gap-1 group cursor-pointer sm:mx-0"
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
