"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ChatContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleChat: () => void;
};

const ChatContext = createContext<ChatContextValue>({
  isOpen: false,
  setIsOpen: () => {},
  toggleChat: () => {},
});

export const useChatbot = () => useContext(ChatContext);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleChat = useCallback(() => setIsOpen((open) => !open), []);
  const value = useMemo(
    () => ({ isOpen, setIsOpen, toggleChat }),
    [isOpen, toggleChat],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
