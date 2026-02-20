import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { getLastRunId } from "@/lib/copilotContext";

export type CopilotPayload = { runId?: string; drug?: string; gene?: string; prefill?: string };
export function triggerCopilot(payload?: CopilotPayload) {
  window.dispatchEvent(new CustomEvent<CopilotPayload>("openCopilot", { detail: payload || {} }));
}

export default function CopilotButton({ className = "", runId, drug, gene }: { className?: string; runId?: string; drug?: string; gene?: string }) {
  return (
    <Button
      className={className}
      variant="secondary"
      onClick={() => triggerCopilot({ runId: runId || getLastRunId() || undefined, drug, gene })}
    >
      <Bot className="h-4 w-4 mr-1" /> Copilot
    </Button>
  );
}
