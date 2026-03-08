import { createContext, ReactNode, useContext, useState, useCallback } from "react";

const ChatContext = createContext({
  isVisible: true,
  isOpen: false,
  toggleChatbot: () => { },
  openChat: () => { },
  toggleChat: () => { },
  setIsOpen: (_open: boolean) => { },
});

export const useChatbot = () => useContext(ChatContext);

interface Props {
  children: ReactNode;
}

export function ChatProvider({ children }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const toggleChatbot = useCallback(() => {
    setIsVisible(!isVisible);
  }, [isVisible]);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <ChatContext.Provider value={{ isVisible, isOpen, toggleChatbot, openChat, toggleChat, setIsOpen }}>
      {children}
    </ChatContext.Provider>
  );
}
