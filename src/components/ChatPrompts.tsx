import { Sparkles } from "lucide-react";
import { Button } from "./ui/Button";

interface ChatPromptsProps {
  onPromptClick: (prompt: string) => void;
}

const prompts = [
  "Give me a quick intro to Akash",
  "What is Akash researching at IIT Roorkee?",
  "Show Akash's recent activities",
  "Which publications are in Ecological Informatics?",
  "What UAV and GIS tools does Akash use?",
  "How can I contact Akash?",
];

export default function ChatPrompts({ onPromptClick }: ChatPromptsProps) {
  return (
    <div className="mt-3 flex w-full max-w-[280px] flex-col gap-2">
      <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
        <Sparkles className="size-3" />
        Try asking
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {prompts.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            onClick={() => onPromptClick(prompt)}
            className="h-auto min-h-8 rounded-full px-3 py-1.5 text-xs"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}
