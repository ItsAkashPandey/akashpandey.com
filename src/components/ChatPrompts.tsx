import { Sparkles } from "lucide-react";
import { Button } from "./ui/Button";

interface ChatPromptsProps {
  onPromptClick: (prompt: string) => void;
}

const prompts = [
  "Give me a quick intro to Akash",
  "What is his PhD research about?",
  "Which drones and GPS receivers has he used?",
  "Which papers are in Ecological Informatics?",
  "What has he been up to recently?",
  "How can I reach him?",
];

export default function ChatPrompts({ onPromptClick }: ChatPromptsProps) {
  return (
    <div className="mt-4 flex w-full flex-col gap-2 pl-9">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Sparkles className="size-3" aria-hidden />
        Try asking
      </p>
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            onClick={() => onPromptClick(prompt)}
            className="h-auto min-h-8 rounded-full px-3 py-1.5 text-left text-xs whitespace-normal"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}
